*&---------------------------------------------------------------------*
*& Report Z_AI_SQL_AGENT
*& Title: AI Agent per interazione Open SQL in linguaggio naturale
*&---------------------------------------------------------------------*
*& Descrizione:
*& Questo report implementa un prototipo completo di Agente AI in ABAP.
*& 1. Riceve una domanda in linguaggio naturale dall'utente.
*& 2. Fornisce all'LLM (OpenAI / Azure / watsonx compatibile) lo schema
*&    delle tabelle SAP abilitate (whitelist) con nomi e descrizioni campi.
*& 3. L'LLM restituisce un JSON strutturato con tabella, campi e clausola WHERE.
*& 4. Il programma valida la sicurezza (whitelist tabelle, check SQL injection).
*& 5. Esegue la SELECT Open SQL dinamica e visualizza i dati a video (ALV / Demo Output).
*&---------------------------------------------------------------------*
REPORT z_ai_sql_agent.

*----------------------------------------------------------------------*
* SELECTION SCREEN
*----------------------------------------------------------------------*
SELECTION-SCREEN BEGIN OF BLOCK b1 WITH FRAME TITLE TEXT-001.
  PARAMETERS: p_prompt TYPE string LOWER CASE OBLIGATORY
              DEFAULT 'Mostrami i clienti con sede a Milano o Roma',
              p_maxrow TYPE i DEFAULT 20.
SELECTION-SCREEN END OF BLOCK b1.

SELECTION-SCREEN BEGIN OF BLOCK b2 WITH FRAME TITLE TEXT-002.
  PARAMETERS: p_url TYPE string LOWER CASE OBLIGATORY
              DEFAULT 'https://api.openai.com/v1/chat/completions',
              p_model TYPE string LOWER CASE OBLIGATORY
              DEFAULT 'gpt-4o-mini',
              p_apikey TYPE string LOWER CASE OBLIGATORY
              DEFAULT 'INSERISCI_LA_TUA_API_KEY'.
SELECTION-SCREEN END OF BLOCK b2.

*----------------------------------------------------------------------*
* CLASS DEFINITION: zcl_ai_sql_agent
*----------------------------------------------------------------------*
CLASS zcl_ai_sql_agent DEFINITION FINAL.
  PUBLIC SECTION.
    TYPES:
      BEGIN OF ty_ai_query_plan,
        table_name   TYPE tabname,
        fields       TYPE string,
        where_clause TYPE string,
        explanation  TYPE string,
      END OF ty_ai_query_plan.

    METHODS:
      constructor
        IMPORTING
          iv_api_url TYPE string
          iv_model   TYPE string
          iv_api_key TYPE string,

      run
        IMPORTING
          iv_prompt   TYPE string
          iv_max_rows TYPE i.

  PRIVATE SECTION.
    DATA:
      mv_api_url       TYPE string,
      mv_model         TYPE string,
      mv_api_key       TYPE string,
      mt_allowed_tables TYPE HASHED TABLE OF tabname WITH UNIQUE KEY table_line.

    METHODS:
      init_whitelist,
      build_schema_context RETURNING VALUE(rv_schema) TYPE string,
      call_llm
        IMPORTING
          iv_user_prompt TYPE string
          iv_schema      TYPE string
        RETURNING
          VALUE(rs_plan) TYPE ty_ai_query_plan
        RAISING
          cx_dynamic_check,
      validate_and_execute
        IMPORTING
          is_plan     TYPE ty_ai_query_plan
          iv_max_rows TYPE i
        RAISING
          cx_dynamic_check,
      display_data
        IMPORTING
          ir_data     TYPE REF TO data
          iv_title    TYPE string
          iv_expl     TYPE string.
ENDCLASS.

*----------------------------------------------------------------------*
* CLASS IMPLEMENTATION: zcl_ai_sql_agent
*----------------------------------------------------------------------*
CLASS zcl_ai_sql_agent IMPLEMENTATION.

  METHOD constructor.
    mv_api_url = iv_api_url.
    mv_model   = iv_model.
    mv_api_key = iv_api_key.
    init_whitelist( ).
  ENDMETHOD.

  METHOD init_whitelist.
    " Definiamo la whitelist di tabelle interrogabili in sicurezza
    " (Es. Anagrafica Clienti KNA1, Fornitori LFA1, Ordini VBAK, Materiali MARA)
    INSERT 'KNA1' INTO TABLE mt_allowed_tables.
    INSERT 'LFA1' INTO TABLE mt_allowed_tables.
    INSERT 'MARA' INTO TABLE mt_allowed_tables.
    INSERT 'MAKT' INTO TABLE mt_allowed_tables.
    INSERT 'VBAK' INTO TABLE mt_allowed_tables.
    INSERT 'VBAP' INTO TABLE mt_allowed_tables.
    INSERT 'SFLIGHT' INTO TABLE mt_allowed_tables.
    INSERT 'SPFLI'   INTO TABLE mt_allowed_tables.
  ENDMETHOD.

  METHOD build_schema_context.
    " Estrae le descrizioni dei campi dal Data Dictionary (DD03M / DD03L)
    " per fornire all'AI il mapping tra concetti di business e nomi tecnici SAP
    DATA: lt_dd03p TYPE TABLE OF dd03p,
          lv_entry TYPE string.

    rv_schema = 'Tabelle SAP disponibili con i relativi campi:' && cl_abap_char_utilities=>newline.

    LOOP AT mt_allowed_tables INTO DATA(lv_tab).
      CALL FUNCTION 'DDIF_TABL_GET'
        EXPORTING
          name          = lv_tab
          langu         = sy-langu
        TABLES
          dd03p_tab     = lt_dd03p
        EXCEPTIONS
          illegal_input = 1
          OTHERS        = 2.

      IF sy-subrc = 0.
        rv_schema = rv_schema && |Tabella { lv_tab }:| && cl_abap_char_utilities=>newline.
        LOOP AT lt_dd03p INTO DATA(ls_field) WHERE fieldname NOT LIKE '/%' AND datatype <> 'CLNT'.
          " Includiamo nome campo, tipo e descrizione
          lv_entry = |  - { ls_field-fieldname } ({ ls_field-datatype }): { ls_field-ddtext }| && cl_abap_char_utilities=>newline.
          rv_schema = rv_schema && lv_entry.
        ENDLOOP.
      ENDIF.
    ENDLOOP.
  ENDMETHOD.

  METHOD call_llm.
    DATA: lo_http_client TYPE REF TO if_http_client,
          lv_payload     TYPE string,
          lv_response    TYPE string,
          lv_sys_prompt  TYPE string.

    " 1. Creazione connessione HTTP
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
      RAISE EXCEPTION TYPE cx_dynamic_check.
    ENDIF.

    " 2. Preparazione System Prompt
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

    " Escaping per JSON
    DATA(lv_escaped_sys)  = escape( val = lv_sys_prompt  format = cl_abap_format=>e_json_string ).
    DATA(lv_escaped_user) = escape( val = iv_user_prompt format = cl_abap_format=>e_json_string ).

    " Costruzione payload compatibile con OpenAI / LLM chat completions
    lv_payload =
      |\{| &&
        |"model": "{ mv_model }",| &&
        |"messages": [| &&
          |\{ "role": "system", "content": "{ lv_escaped_sys }" \},| &&
          |\{ "role": "user", "content": "{ lv_escaped_user }" \}| &&
        |],| &&
        |"temperature": 0.0| &&
      |\}|.

    lo_http_client->request->set_method( if_http_request=>co_request_method_post ).
    lo_http_client->request->set_header_field( name = 'Content-Type'  value = 'application/json' ).
    lo_http_client->request->set_header_field( name = 'Authorization' value = |Bearer { mv_api_key }| ).
    lo_http_client->request->set_cdata( lv_payload ).

    lo_http_client->send(
      EXCEPTIONS
        http_communication_failure = 1
        http_invalid_state         = 2
        OTHERS                     = 3 ).
    IF sy-subrc <> 0.
      lo_http_client->close( ).
      RAISE EXCEPTION TYPE cx_dynamic_check.
    ENDIF.

    lo_http_client->receive(
      EXCEPTIONS
        http_communication_failure = 1
        http_invalid_state         = 2
        http_processing_failed     = 3
        OTHERS                     = 4 ).
    IF sy-subrc <> 0.
      lo_http_client->close( ).
      RAISE EXCEPTION TYPE cx_dynamic_check.
    ENDIF.

    lv_response = lo_http_client->response->get_cdata( ).
    lo_http_client->close( ).

    " 3. Parsing della risposta
    " Estraiamo il contenuto dal path response->choices[0]->message->content
    " Per garantire la massima compatibilità anche su sistemi SAP più vecchi usiamo /ui2/cl_json o deserializzazione
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

    /ui2/cl_json=>deserialize(
      EXPORTING
        json = lv_response
      CHANGING
        data = ls_llm_res ).

    IF ls_llm_res-choices IS INITIAL.
      MESSAGE |Errore nella risposta LLM: { lv_response }| TYPE 'E'.
      RAISE EXCEPTION TYPE cx_dynamic_check.
    ENDIF.

    DATA(lv_content) = ls_llm_res-choices[ 1 ]-message-content.

    " Pulizia da eventuali backtick markdown generati dal modello
    REPLACE ALL OCCURRENCES OF '```json' IN lv_content WITH ''.
    REPLACE ALL OCCURRENCES OF '```' IN lv_content WITH ''.
    CONDENSE lv_content.

    " Deserializziamo il JSON dell'agente nella struttura ty_ai_query_plan
    /ui2/cl_json=>deserialize(
      EXPORTING
        json = lv_content
      CHANGING
        data = rs_plan ).

    " Normalizzazione nome tabella
    TRANSLATE rs_plan-table_name TO UPPER CASE.
    CONDENSE rs_plan-table_name.
  ENDMETHOD.

  METHOD validate_and_execute.
    " 1. CONTROLLO DI SICUREZZA: Whitelist tabella
    IF NOT line_exists( mt_allowed_tables[ table_line = is_plan-table_name ] ).
      MESSAGE |La tabella { is_plan-table_name } non e presente nella whitelist di sicurezza!| TYPE 'E'.
      RETURN.
    ENDIF.

    " 2. CONTROLLO DI SICUREZZA: Sanificazione nome tabella contro SQL Injection
    DATA(lv_safe_table) = cl_abap_dyn_prg=>check_table_name_str(
                            val      = is_plan-table_name
                            packages = '' ).

    " 3. Preparazione dei campi e WHERE clause
    DATA(lv_fields) = is_plan-fields.
    IF lv_fields IS INITIAL.
      lv_fields = '*'.
    ENDIF.

    DATA(lv_where) = is_plan-where_clause.
    IF lv_where IS INITIAL OR lv_where = '""'.
      lv_where = '1 = 1'.
    ENDIF.

    " 4. Creazione dinamica della tabella interna di destinazione
    DATA: lr_data_tab TYPE REF TO data.
    CREATE DATA lr_data_tab TYPE TABLE OF (lv_safe_table).
    ASSIGN lr_data_tab->* TO FIELD-SYMBOL(<lt_table>).

    " 5. Esecuzione Open SQL dinamico
    TRY.
        SELECT (lv_fields)
          FROM (lv_safe_table)
          WHERE (lv_where)
          INTO CORRESPONDING FIELDS OF TABLE @<lt_table>
          UP TO @iv_max_rows ROWS.

        IF sy-subrc = 0.
          display_data(
            ir_data  = lr_data_tab
            iv_title = |Risultati da { lv_safe_table } ({ lines( <lt_table> ) } record trovati)|
            iv_expl  = is_plan-explanation ).
        ELSE.
          WRITE: / |Nessun record trovato nella tabella { lv_safe_table } con i criteri specificati.|.
          WRITE: / |Spiegazione AI: { is_plan-explanation }|.
          WRITE: / |WHERE applicata: { lv_where }|.
        ENDIF.

      CATCH cx_sy_dynamic_osql_error INTO DATA(lx_osql).
        WRITE: / |Errore Open SQL dinamico: { lx_osql->get_text( ) }| COLOR COL_NEGATIVE.
        WRITE: / |Query tentata: SELECT { lv_fields } FROM { lv_safe_table } WHERE { lv_where }|.
    ENDTRY.
  ENDMETHOD.

  METHOD display_data.
    " Mostra i risultati e la spiegazione generata dall'AI
    WRITE: / |========================================================================| COLOR COL_HEADING.
    WRITE: / | AI AGENT OPEN SQL - RISULTATI ESECUZIONE| COLOR COL_HEADING.
    WRITE: / |========================================================================| COLOR COL_HEADING.
    WRITE: / |Spiegazione Query:| COLOR COL_KEY, iv_expl.
    SKIP.

    " Utilizzo di CL_DEMO_OUTPUT per visualizzare la tabella dinamica formattata
    cl_demo_output=>write_data(
      value = ir_data->*
      name  = iv_title ).

    cl_demo_output=>display( ).
  ENDMETHOD.

  METHOD run.
    TRY.
        WRITE: / |[1/3] Analisi dello schema delle tabelle SAP autorizzate in corso...|.
        DATA(lv_schema) = build_schema_context( ).

        WRITE: / |[2/3] Interrogazione modello AI per generazione Open SQL...|.
        DATA(ls_plan) = call_llm(
                          iv_user_prompt = iv_prompt
                          iv_schema      = lv_schema ).

        WRITE: / |Tabella individuata:| COLOR COL_GROUP, ls_plan-table_name.
        WRITE: / |Campi richiesti:    | COLOR COL_GROUP, ls_plan-fields.
        WRITE: / |Condizione WHERE:   | COLOR COL_GROUP, ls_plan-where_clause.
        WRITE: / |Spiegazione:        | COLOR COL_GROUP, ls_plan-explanation.
        SKIP.

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
* START-OF-SELECTION
*----------------------------------------------------------------------*
START-OF-SELECTION.
  DATA(lo_agent) = NEW zcl_ai_sql_agent(
    iv_api_url = p_url
    iv_model   = p_model
    iv_api_key = p_apikey ).

  lo_agent->run(
    iv_prompt   = p_prompt
    iv_max_rows = p_maxrow ).
