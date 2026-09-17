*&---------------------------------------------------------------------*
*& Report Z_AI_SQL_AGENT
*& Title: AI Agent per interazione e query Open SQL in linguaggio naturale
*& Autore: Sviluppato per architettura SAP ABAP + LLM (OpenAI / Azure / watsonx)
*&---------------------------------------------------------------------*
*& DESCRIZIONE ARCHITETTURALE DETTAGLIATA:
*& -------------------------------------------------------------------
*& Questo programma implementa un prototipo completo end-to-end di un
*& Agente AI all'interno dell'ambiente SAP NetWeaver / SAP S/4HANA.
*&
*& FLUSSO DI ESECUZIONE (FASI):
*& 1. SELECTION SCREEN:
*&    - L'utente inserisce la propria domanda di business in linguaggio
*&      naturale (es. "Elenca i clienti di Milano o Roma con codice e città")
*&      e specifica i parametri di connessione API all'LLM.
*&
*& 2. INTROSPEZIONE METADATI (RAG DIZIONARIO DATI):
*&    - Il programma interroga il Data Dictionary SAP (funzione DDIF_TABL_GET)
*&      per le sole tabelle presenti nella Whitelist autorizzata.
*&    - Estrae i nomi tecnici dei campi, i tipi e i testi esplicativi
*&      nella lingua di login (sy-langu), creando la mappatura semantica
*&      (es. KUNNR -> Codice cliente, ORT01 -> Città).
*&
*& 3. PROMPT ENGINEERING & INVOCAZIONE LLM VIA HTTP:
*&    - Viene composto un System Prompt vincolante che istruisce il modello
*&      a generare esclusivamente un payload JSON con tabella, campi,
*&      WHERE clause valida in Open SQL e motivazione logica.
*&    - Effettua una chiamata HTTP POST REST tramite CL_HTTP_CLIENT.
*&
*& 4. PARSING & VALIDAZIONE DI SICUREZZA:
*&    - Deserializza la risposta JSON con /UI2/CL_JSON.
*&    - Controlla che la tabella appartenga tassativamente alla Whitelist.
*&    - Sanifica il nome tabella tramite CL_ABAP_DYN_PRG contro SQL Injection.
*&
*& 5. ESECUZIONE DINAMICA OPEN SQL & PRESENTAZIONE DATI:
*&    - Alloca a runtime una tabella interna anonima (CREATE DATA).
*&    - Esegue la SELECT Open SQL dinamica con clausola protetta UP TO ROWS.
*&    - Visualizza i record estratti tramite la classe CL_DEMO_OUTPUT.
*&---------------------------------------------------------------------*
REPORT z_ai_sql_agent.

*----------------------------------------------------------------------*
* SELECTION SCREEN: Schermata di input per l'utente finale
*----------------------------------------------------------------------*
SELECTION-SCREEN BEGIN OF BLOCK b1 WITH FRAME TITLE TEXT-001.
  " Parametro obbligatorio per la query/richiesta in linguaggio naturale
  PARAMETERS: p_prompt TYPE string LOWER CASE OBLIGATORY
              DEFAULT 'Mostrami i clienti con sede a Milano o Roma',
              " Limite massimo di righe per evitare consumi eccessivi di memoria nell'Application Server
              p_maxrow TYPE i DEFAULT 20.
SELECTION-SCREEN END OF BLOCK b1.

SELECTION-SCREEN BEGIN OF BLOCK b2 WITH FRAME TITLE TEXT-002.
  " Endpoint del modello LLM (compatibile con le API standard OpenAI Chat Completions, Azure OpenAI, watsonx)
  PARAMETERS: p_url    TYPE string LOWER CASE OBLIGATORY
              DEFAULT 'https://api.openai.com/v1/chat/completions',
              " Modello LLM target (es. gpt-4o, gpt-4o-mini, watsonx-granite, ecc.)
              p_model  TYPE string LOWER CASE OBLIGATORY
              DEFAULT 'gpt-4o-mini',
              " API Key per l'autenticazione Bearer Token
              p_apikey TYPE string LOWER CASE OBLIGATORY
              DEFAULT 'INSERISCI_LA_TUA_API_KEY'.
SELECTION-SCREEN END OF BLOCK b2.

*----------------------------------------------------------------------*
* CLASS DEFINITION: zcl_ai_sql_agent
*----------------------------------------------------------------------*
CLASS zcl_ai_sql_agent DEFINITION FINAL.
  PUBLIC SECTION.
    " Struttura dati per memorizzare il piano di estrazione SQL restituito dall'AI in formato JSON
    TYPES:
      BEGIN OF ty_ai_query_plan,
        table_name   TYPE tabname, " Nome tecnico della tabella SAP individuata (es. KNA1, VBAK)
        fields       TYPE string,  " Elenco campi separati da virgola (es. KUNNR, NAME1, ORT01)
        where_clause TYPE string,  " Condizione logica Open SQL (es. ORT01 = 'Milano' OR ORT01 = 'Roma')
        explanation  TYPE string,  " Spiegazione testuale per l'utente della strategia adottata
      END OF ty_ai_query_plan.

    METHODS:
      " Costruttore: Inizializza le configurazioni di rete e la whitelist delle tabelle
      constructor
        IMPORTING
          iv_api_url TYPE string
          iv_model   TYPE string
          iv_api_key TYPE string,

      " Metodo principale di orchestrazione dell'agente (Workflow completo)
      run
        IMPORTING
          iv_prompt   TYPE string
          iv_max_rows TYPE i.

  PRIVATE SECTION.
    DATA:
      mv_api_url        TYPE string,
      mv_model          TYPE string,
      mv_api_key        TYPE string,
      " Tabella hash per verificare in tempo O(1) se una tabella richiesta è autorizzata
      mt_allowed_tables TYPE HASHED TABLE OF tabname WITH UNIQUE KEY table_line.

    METHODS:
      " Popola l'elenco delle tabelle consentite per l'interrogazione
      init_whitelist,

      " Legge dal Data Dictionary SAP i metadati (campi e descrizioni) per arricchire il prompt AI
      build_schema_context
        RETURNING VALUE(rv_schema) TYPE string,

      " Invia la richiesta HTTP POST all'LLM e deserializza il JSON di risposta
      call_llm
        IMPORTING
          iv_user_prompt TYPE string
          iv_schema      TYPE string
        RETURNING
          VALUE(rs_plan) TYPE ty_ai_query_plan
        RAISING
          cx_dynamic_check,

      " Valida la sicurezza della query ed esegue il Dynamic Open SQL
      validate_and_execute
        IMPORTING
          is_plan     TYPE ty_ai_query_plan
          iv_max_rows TYPE i
        RAISING
          cx_dynamic_check,

      " Formatta e stampa a video i record estratti e la spiegazione AI
      display_data
        IMPORTING
          ir_data  TYPE REF TO data
          iv_title TYPE string
          iv_expl  TYPE string.
ENDCLASS.

*----------------------------------------------------------------------*
* CLASS IMPLEMENTATION: zcl_ai_sql_agent
*----------------------------------------------------------------------*
CLASS zcl_ai_sql_agent IMPLEMENTATION.

  "--------------------------------------------------------------------
  " METHOD constructor: Inizializzazione istanza e whitelist
  "--------------------------------------------------------------------
  METHOD constructor.
    mv_api_url = iv_api_url.
    mv_model   = iv_model.
    mv_api_key = iv_api_key.
    init_whitelist( ).
  ENDMETHOD.

  "--------------------------------------------------------------------
  " METHOD init_whitelist: Definizione delle tabelle SAP consultabili
  " NOTA DI SICUREZZA: Solo le tabelle inserite qui possono essere lette.
  " Nessuna tabella di sistema (es. USR02, TADIR, PROGDIR) deve essere aggiunta.
  "--------------------------------------------------------------------
  METHOD init_whitelist.
    " Tabelle Modulo SD / MM / Flight Demo:
    INSERT 'KNA1'    INTO TABLE mt_allowed_tables. " Anagrafica Clienti (Generale)
    INSERT 'LFA1'    INTO TABLE mt_allowed_tables. " Anagrafica Fornitori (Generale)
    INSERT 'MARA'    INTO TABLE mt_allowed_tables. " Anagrafica Articoli / Materiali
    INSERT 'MAKT'    INTO TABLE mt_allowed_tables. " Testi e descrizioni materiali
    INSERT 'VBAK'    INTO TABLE mt_allowed_tables. " Testata ordini di vendita (Sales Orders)
    INSERT 'VBAP'    INTO TABLE mt_allowed_tables. " Posizioni ordini di vendita
    INSERT 'SFLIGHT' INTO TABLE mt_allowed_tables. " Tabella demo SAP: Voli e tariffe
    INSERT 'SPFLI'   INTO TABLE mt_allowed_tables. " Tabella demo SAP: Tratte e orari voli
  ENDMETHOD.

  "--------------------------------------------------------------------
  " METHOD build_schema_context: Estrazione dinamica metadati dal Dizionario
  " Consente all'LLM di conoscere il nome dei campi (es. ORT01 = Città, KUNNR = Cliente)
  " senza doverli codificare manualmente nel prompt.
  "--------------------------------------------------------------------
  METHOD build_schema_context.
    DATA: lt_dd03p TYPE TABLE OF dd03p, " Struttura per i metadati dei campi del dizionario
          lv_entry TYPE string.

    rv_schema = 'Tabelle SAP disponibili con i relativi campi:' && cl_abap_char_utilities=>newline.

    " Ciclo su ogni tabella della Whitelist per leggere i campi da SAP
    LOOP AT mt_allowed_tables INTO DATA(lv_tab).
      CALL FUNCTION 'DDIF_TABL_GET'
        EXPORTING
          name          = lv_tab
          langu         = sy-langu " Lingua dell'utente corrente per avere i testi tradotti
        TABLES
          dd03p_tab     = lt_dd03p
        EXCEPTIONS
          illegal_input = 1
          OTHERS        = 2.

      IF sy-subrc = 0.
        rv_schema = rv_schema && |Tabella { lv_tab }:| && cl_abap_char_utilities=>newline.

        " Filtriamo i campi tecnici speciali (come il mandante CLNT o campi / namespace)
        LOOP AT lt_dd03p INTO DATA(ls_field) WHERE fieldname NOT LIKE '/%' AND datatype <> 'CLNT'.
          " Formato: - NOME_CAMPO (TIPO): Descrizione descrittiva in lingua utente
          lv_entry = |  - { ls_field-fieldname } ({ ls_field-datatype }): { ls_field-ddtext }| && cl_abap_char_utilities=>newline.
          rv_schema = rv_schema && lv_entry.
        ENDLOOP.
      ENDIF.
    ENDLOOP.
  ENDMETHOD.

  "--------------------------------------------------------------------
  " METHOD call_llm: Invia la richiesta HTTP POST all'endpoint del modello AI
  "--------------------------------------------------------------------
  METHOD call_llm.
    DATA: lo_http_client TYPE REF TO if_http_client,
          lv_payload     TYPE string,
          lv_response    TYPE string,
          lv_sys_prompt  TYPE string.

    " 1. Creazione del client HTTP verso l'URL specificato
    cl_http_client=>create_by_url(
      EXPORTING
        url                = mv_api_url
      IMPORTING
        client             = lo_http_client
      EXCEPTIONS
        argument_not_found = 1
        plugin_not_active  = 2
        internal_error     = 3
        OTHERS             = 4 ).

    IF sy-subrc <> 0.
      MESSAGE 'Impossibile inizializzare il client HTTP. Verifica l''URL.' TYPE 'E'.
      RAISE EXCEPTION TYPE cx_dynamic_check.
    ENDIF.

    " 2. Definizione del System Prompt (Ruolo e vincoli dell'Agente)
    lv_sys_prompt =
      'Sei un esperto sviluppatore SAP ABAP. Il tuo compito e convertire la richiesta dell''utente ' &&
      'in una query Open SQL valida per SAP.' && cl_abap_char_utilities=>newline &&
      'Regole ferree:' && cl_abap_char_utilities=>newline &&
      '1. Usa SOLO le tabelle fornite nello schema.' && cl_abap_char_utilities=>newline &&
      '2. Restituisci ESCLUSIVAMENTE un JSON valido con questa struttura esatta:' && cl_abap_char_utilities=>newline &&
      '   {' &&
      '     "table_name": "NOME_TABELLA",' &&
      '     "fields": "CAMPO1, CAMPO2, CAMPO3",' &&
      '     "where_clause": "CONDIZIONE_OPEN_SQL",' &&
      '     "explanation": "Breve spiegazione in italiano della selezione effettuata"' &&
      '   }' && cl_abap_char_utilities=>newline &&
      '3. Nella clausola where_clause usa la sintassi Open SQL valida (stringhe tra apici singoli, es: ORT01 = ''Milano'').' && cl_abap_char_utilities=>newline &&
      '4. Se non sono necessari filtri, where_clause deve essere una stringa vuota "" o "1 = 1".' && cl_abap_char_utilities=>newline &&
      '5. Non usare commenti, formattazione markdown (niente ```json), solo il testo JSON grezzo.' && cl_abap_char_utilities=>newline &&
      iv_schema.

    " 3. Sanitizzazione delle stringhe per inserimento sicuro nel payload JSON
    DATA(lv_escaped_sys)  = escape( val = lv_sys_prompt  format = cl_abap_format=>e_json_string ).
    DATA(lv_escaped_user) = escape( val = iv_user_prompt format = cl_abap_format=>e_json_string ).

    " 4. Costruzione del body JSON (Schema OpenAI Chat Completions / BTP Generative AI Hub)
    lv_payload =
      |\{| &&
        |"model": "{ mv_model }",| &&
        |"messages": [| &&
          |\{ "role": "system", "content": "{ lv_escaped_sys }" \},| &&
          |\{ "role": "user", "content": "{ lv_escaped_user }" \}| &&
        |],| &&
        |"temperature": 0.0| && " Temperatura 0 per risposte deterministiche e precise
      |\}|.

    " 5. Configurazione degli Header HTTP e invio
    lo_http_client->request->set_method( if_http_request=>co_request_method_post ).
    lo_http_client->request->set_header_field( name = 'Content-Type'  value = 'application/json' ).
    lo_http_client->request->set_header_field( name = 'Authorization' value = |Bearer { mv_api_key }| ).
    lo_http_client->request->set_cdata( lv_payload ).

    " Invio richiesta
    lo_http_client->send(
      EXCEPTIONS
        http_communication_failure = 1
        http_invalid_state         = 2
        OTHERS                     = 3 ).
    IF sy-subrc <> 0.
      lo_http_client->close( ).
      MESSAGE 'Errore di comunicazione durante l''invio della richiesta HTTP.' TYPE 'E'.
      RAISE EXCEPTION TYPE cx_dynamic_check.
    ENDIF.

    " Ricezione risposta
    lo_http_client->receive(
      EXCEPTIONS
        http_communication_failure = 1
        http_invalid_state         = 2
        http_processing_failed     = 3
        OTHERS                     = 4 ).
    IF sy-subrc <> 0.
      lo_http_client->close( ).
      MESSAGE 'Errore durante la ricezione della risposta dal server AI.' TYPE 'E'.
      RAISE EXCEPTION TYPE cx_dynamic_check.
    ENDIF.

    lv_response = lo_http_client->response->get_cdata( ).
    lo_http_client->close( ).

    " 6. Deserializzazione della risposta JSON dell'API
    TYPES:
      BEGIN OF ty_msg,
        content TYPE string,
      END OF ty_msg,
      BEGIN OF ty_choice,
        message TYPE ty_msg,
      END OF ty_choice,
      BEGIN OF ty_llm_res,
        choices TYPE TABLE OF ty_choice WITH DEFAULT KEY,
      END OF ty_llm_res.

    DATA: ls_llm_res TYPE ty_llm_res.

    " Utilizzo della classe standard /ui2/cl_json presente in tutti i sistemi NetWeaver / S/4HANA
    /ui2/cl_json=>deserialize(
      EXPORTING
        json = lv_response
      CHANGING
        data = ls_llm_res ).

    IF ls_llm_res-choices IS INITIAL.
      MESSAGE |Errore o risposta non valida ricevuta dal modello: { lv_response }| TYPE 'E'.
      RAISE EXCEPTION TYPE cx_dynamic_check.
    ENDIF.

    DATA(lv_content) = ls_llm_res-choices[ 1 ]-message-content.

    " Rimozione di eventuali blocchi markdown ```json ... ``` se inseriti dal modello
    REPLACE ALL OCCURRENCES OF '```json' IN lv_content WITH ''.
    REPLACE ALL OCCURRENCES OF '```'     IN lv_content WITH ''.
    CONDENSE lv_content.

    " Deserializzazione del piano di query nella struttura ty_ai_query_plan
    /ui2/cl_json=>deserialize(
      EXPORTING
        json = lv_content
      CHANGING
        data = rs_plan ).

    " Normalizzazione del nome tabella (maiuscolo e senza spazi superflui)
    TRANSLATE rs_plan-table_name TO UPPER CASE.
    CONDENSE rs_plan-table_name.
  ENDMETHOD.

  "--------------------------------------------------------------------
  " METHOD validate_and_execute: Validazione di sicurezza ed esecuzione Open SQL
  "--------------------------------------------------------------------
  METHOD validate_and_execute.
    " 1. CONTROLLO DI SICUREZZA 1: Whitelist Check
    " Blocca l'esecuzione se l'AI ha selezionato una tabella non esplicitamente autorizzata
    IF NOT line_exists( mt_allowed_tables[ table_line = is_plan-table_name ] ).
      MESSAGE |SICUREZZA: La tabella { is_plan-table_name } non e presente nella whitelist! Accesso negato.| TYPE 'E'.
      RETURN.
    ENDIF.

    " 2. CONTROLLO DI SICUREZZA 2: Sanificazione del nome tabella contro SQL Injection
    " La classe CL_ABAP_DYN_PRG verifica che il nome della tabella sia conforme alle regole SAP
    DATA(lv_safe_table) = cl_abap_dyn_prg=>check_table_name_str(
                            val      = is_plan-table_name
                            packages = '' ).

    " 3. Preparazione dei campi e della clausola WHERE
    DATA(lv_fields) = is_plan-fields.
    IF lv_fields IS INITIAL.
      lv_fields = '*'. " Se non specificati, estrae tutti i campi
    ENDIF.

    DATA(lv_where) = is_plan-where_clause.
    IF lv_where IS INITIAL OR lv_where = '""'.
      lv_where = '1 = 1'. " Condizione sempre vera in assenza di filtri
    ENDIF.

    " 4. Allocazione dinamica della tabella interna di output (Run-Time Type Creation)
    DATA: lr_data_tab TYPE REF TO data.
    CREATE DATA lr_data_tab TYPE TABLE OF (lv_safe_table).
    ASSIGN lr_data_tab->* TO FIELD-SYMBOL(<lt_table>).

    " 5. Esecuzione del Dynamic Open SQL
    " La sintassi con parentesi (campo/tabella) indica a SAP di risolvere i valori a runtime
    TRY.
        SELECT (lv_fields)
          FROM (lv_safe_table)
          WHERE (lv_where)
          INTO CORRESPONDING FIELDS OF TABLE @<lt_table>
          UP TO @iv_max_rows ROWS.

        IF sy-subrc = 0.
          " Dati trovati: Visualizzazione a video
          display_data(
            ir_data  = lr_data_tab
            iv_title = |Risultati estratti dalla tabella { lv_safe_table } ({ lines( <lt_table> ) } record)|
            iv_expl  = is_plan-explanation ).
        ELSE.
          " Nessun record corrisponde ai criteri
          WRITE: / |Nessun record trovato nella tabella { lv_safe_table } con i criteri specificati.| COLOR COL_TOTAL.
          WRITE: / |Spiegazione AI : { is_plan-explanation }|.
          WRITE: / |WHERE applicata: { lv_where }|.
        ENDIF.

      " Cattura eventuali errori di sintassi nella clausola WHERE generata dinamicamente
      CATCH cx_sy_dynamic_osql_error INTO DATA(lx_osql).
        WRITE: / |Errore Open SQL dinamico: { lx_osql->get_text( ) }| COLOR COL_NEGATIVE.
        WRITE: / |Query tentata: SELECT { lv_fields } FROM { lv_safe_table } WHERE { lv_where }|.
    ENDTRY.
  ENDMETHOD.

  "--------------------------------------------------------------------
  " METHOD display_data: Output a video con CL_DEMO_OUTPUT
  "--------------------------------------------------------------------
  METHOD display_data.
    WRITE: / |========================================================================| COLOR COL_HEADING.
    WRITE: / | AI AGENT OPEN SQL - RISULTATI ESECUZIONE                                | COLOR COL_HEADING.
    WRITE: / |========================================================================| COLOR COL_HEADING.
    WRITE: / |Spiegazione Query:| COLOR COL_KEY, iv_expl.
    SKIP.

    " CL_DEMO_OUTPUT renderizza automaticamente la struttura dinamica della tabella interna
    cl_demo_output=>write_data(
      value = ir_data->*
      name  = iv_title ).

    cl_demo_output=>display( ).
  ENDMETHOD.

  "--------------------------------------------------------------------
  " METHOD run: Workflow orchestratore delle 3 fasi dell'agente
  "--------------------------------------------------------------------
  METHOD run.
    TRY.
        " Fase 1: RAG Dizionario Dati
        WRITE: / |[1/3] Analisi dello schema delle tabelle SAP autorizzate in corso...|.
        DATA(lv_schema) = build_schema_context( ).

        " Fase 2: Inferenza AI
        WRITE: / |[2/3] Interrogazione modello AI per generazione Open SQL...|.
        DATA(ls_plan) = call_llm(
                          iv_user_prompt = iv_prompt
                          iv_schema      = lv_schema ).

        " Log a video del piano di query generato
        WRITE: / |Tabella individuata:| COLOR COL_GROUP, ls_plan-table_name.
        WRITE: / |Campi richiesti:    | COLOR COL_GROUP, ls_plan-fields.
        WRITE: / |Condizione WHERE:   | COLOR COL_GROUP, ls_plan-where_clause.
        WRITE: / |Spiegazione:        | COLOR COL_GROUP, ls_plan-explanation.
        SKIP.

        " Fase 3: Validazione di sicurezza ed esecuzione query
        WRITE: / |[3/3] Validazione ed esecuzione Dynamic Open SQL...|.
        validate_and_execute(
          is_plan     = ls_plan
          iv_max_rows = iv_max_rows ).

      CATCH cx_root INTO DATA(lx_err).
        WRITE: / |Errore durante l'esecuzione dell'Agente AI: { lx_err->get_text( ) }| COLOR COL_NEGATIVE.
    ENDTRY.
  ENDMETHOD.

ENDCLASS.

*----------------------------------------------------------------------*
* START-OF-SELECTION: Evento di avvio del programma ABAP
*----------------------------------------------------------------------*
START-OF-SELECTION.
  " Istanziazione dell'agente con i parametri forniti a video
  DATA(lo_agent) = NEW zcl_ai_sql_agent(
    iv_api_url = p_url
    iv_model   = p_model
    iv_api_key = p_apikey ).

  " Avvio dell'elaborazione
  lo_agent->run(
    iv_prompt   = p_prompt
    iv_max_rows = p_maxrow ).
