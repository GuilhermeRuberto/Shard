import streamlit as st
import pandas as pd
import gspread
from oauth2client.service_account import ServiceAccountCredentials

# ==========================================
# 1. CONFIGURAÇÃO DA PÁGINA
# ==========================================
st.set_page_config(
    page_title="PrintFarm OS",
    page_icon="🖨️",
    layout="wide"
)

# ==========================================
# 2. CONEXÃO COM O GOOGLE SHEETS
# ==========================================
ID_PLANILHA = "1QL0jnPnw-3H5OMwc-jUmSKiTnp7PsnLx7x2bdYOyyVw"
NOME_ARQUIVO_JSON = "credentials.json"

@st.cache_resource
def conectar_google_sheets():
    scope = [
        "https://spreadsheets.google.com/feeds",
        "https://www.googleapis.com/auth/drive"
    ]
    creds = ServiceAccountCredentials.from_json_keyfile_name(NOME_ARQUIVO_JSON, scope)
    client = gspread.authorize(creds)
    return client

try:
    client = conectar_google_sheets()
    spreadsheet = client.open_by_key(ID_PLANILHA)
    aba_custos = spreadsheet.worksheet("Tabela de Custos")
    aba_catalogo = spreadsheet.worksheet("Catalogo")
    aba_tecnico = spreadsheet.worksheet("Catalogo Tecnico")
    conexao_ok = True
except Exception as e:
    conexao_ok = False
    st.error(f"❌ Erro ao conectar com as abas da planilha: {e}")

# Auxiliar para extrair valor numérico de strings tipo "R$/kg 88.50"
def extrair_valor_numerico(texto_unidade):
    try:
        partes = str(texto_unidade).replace(',', '.').split()
        for parte in partes:
            try:
                return float(parte)
            except ValueError:
                continue
        return 0.0
    except Exception:
        return 0.0

# ==========================================
# 3. BARRA LATERAL - NAVEGAÇÃO
# ==========================================
st.sidebar.title("🖨️ PrintFarm OS")
pagina = st.sidebar.radio(
    "Navegação",
    [
        "⚙️ Gestão de Custos & Insumos",
        "📦 Cadastrar Produto (Pai & Técnico)",
        "📊 Visualizar Catálogos"
    ]
)

# ==========================================
# 4. PÁGINA 1: GESTÃO DE CUSTOS & INSUMOS
# ==========================================
if pagina == "⚙️ Gestão de Custos & Insumos":
    st.title("⚙️ Tabela de Custos (Insumos Base)")
    st.caption("Cadastre e remova os insumos que servem de base para o cálculo dos produtos.")
    st.markdown("---")

    if conexao_ok:
        dados_brutos = aba_custos.get_all_values()
        coluna_ids = aba_custos.col_values(1)
        ids_preenchidos = [id_val for id_val in coluna_ids if id_val.strip()]
        
        if len(dados_brutos) > 1:
            df_custos = pd.DataFrame(dados_brutos[1:], columns=dados_brutos[0])
        else:
            df_custos = pd.DataFrame()

        tab_cadastrar, tab_excluir = st.tabs(["➕ Cadastrar Novo Insumo", "🗑️ Excluir Insumo (CUS)"])

        # --- ABA CADASTRAR CUS ---
        with tab_cadastrar:
            qtd_registros = max(0, len(ids_preenchidos) - 1)
            proximo_id = f"CUS_{qtd_registros + 1:02d}"

            with st.form("form_cadastro_cus", clear_on_submit=True):
                col1, col2, col3 = st.columns([1, 2, 2])
                with col1:
                    st.text_input("ID Gerado", value=proximo_id, disabled=True)
                with col2:
                    categoria = st.selectbox(
                        "Categoria",
                        ["FILAMENTO", "ENERGIA", "OPERAÇÃO", "EMBALAGEM", "INSUMO_EXTRA", "OUTROS"]
                    )
                with col3:
                    nome_insumo = st.text_input("Nome do Insumo", placeholder="Ex: PLA Silk Gold 1kg")

                col4, col5 = st.columns(2)
                with col4:
                    unidade_tipo = st.selectbox(
                        "Unidade de Medida",
                        ["R$/kg", "R$/kWh", "R$/h", "R$/unid", "%", "W"]
                    )
                with col5:
                    valor_unitario = st.number_input(
                        "Valor / Custo Unitário", 
                        min_value=0.0, 
                        step=0.50, 
                        format="%.2f"
                    )

                btn_salvar = st.form_submit_button("🚀 Salvar Insumo")

            if btn_salvar:
                if not nome_insumo.strip():
                    st.warning("⚠️ O campo Nome do Insumo é obrigatório.")
                else:
                    try:
                        proxima_linha = len(ids_preenchidos) + 1
                        if proxima_linha > aba_custos.row_count:
                            aba_custos.add_rows(10)

                        if unidade_tipo in ["%", "W"]:
                            unidade_formatada = f"{valor_unitario:.2f}{unidade_tipo}"
                        else:
                            unidade_formatada = f"{unidade_tipo} {valor_unitario:.2f}"

                        nova_linha = [str(proximo_id), str(categoria), str(nome_insumo), str(unidade_formatada)]
                        intervalo_alvo = f"A{proxima_linha}:D{proxima_linha}"
                        aba_custos.update(intervalo_alvo, [nova_linha], value_input_option='USER_ENTERED')

                        st.success(f"✅ Insumo **{nome_insumo}** (`{proximo_id}`) salvo!")
                        st.cache_resource.clear()
                        st.rerun()
                    except Exception as err:
                        st.error(f"🚨 Erro ao salvar: {err}")

        # --- ABA EXCLUIR CUS ---
        with tab_excluir:
            st.subheader("🗑️ Excluir Insumo da Tabela de Custos")
            lista_cus = [id_cus for id_cus in ids_preenchidos if id_cus != "ID CUS"]

            if lista_cus:
                col_sel, col_btn = st.columns([3, 1])
                with col_sel:
                    cus_para_deletar = st.selectbox("Selecione o CUS que deseja remover:", lista_cus)
                
                with col_btn:
                    st.write("")
                    st.write("")
                    btn_deletar = st.button("🔴 Confirmar Exclusão", type="primary")

                if btn_deletar:
                    try:
                        linha_para_deletar = coluna_ids.index(cus_para_deletar) + 1
                        aba_custos.delete_rows(linha_para_deletar)

                        st.success(f"✅ Item `{cus_para_deletar}` removido com sucesso!")
                        st.cache_resource.clear()
                        st.rerun()
                    except Exception as err:
                        st.error(f"🚨 Erro ao tentar excluir: {err}")
            else:
                st.info("Nenhum insumo disponível para exclusão.")

        st.markdown("---")
        st.subheader("📋 Insumos Cadastrados")
        if not df_custos.empty:
            st.dataframe(df_custos, use_container_width=True, hide_index=True)


# ==========================================
# 5. PÁGINA 2: CADASTRO DE PRODUTO (PAI & TECNICO)
# ==========================================
elif pagina == "📦 Cadastrar Produto (Pai & Técnico)":
    st.title("📦 Cadastro de Produto Final")
    st.caption("Crie o produto final e vincule os insumos da Tabela de Custos no Catálogo Técnico.")
    st.markdown("---")

    if conexao_ok:
        # Puxa CUS existentes
        dados_custos = aba_custos.get_all_values()
        if len(dados_custos) > 1:
            df_custos = pd.DataFrame(dados_custos[1:], columns=dados_custos[0])
        else:
            df_custos = pd.DataFrame()

        if df_custos.empty:
            st.warning("⚠️ Cadastre insumos na 'Tabela de Custos' antes de criar um produto.")
        else:
            # Gerador de ID SKU
            skus_existentes = aba_catalogo.col_values(1)
            skus_validos = [s for s in skus_existentes if s.strip() and s != "ID SKU"]
            proximo_sku = f"SKU_{len(skus_validos) + 1:02d}"

            with st.form("form_novo_produto"):
                st.subheader("1. Ficha do Produto (Pai)")
                c1, c2, c3 = st.columns([1, 2, 2])
                with c1:
                    st.text_input("ID SKU Gerado", value=proximo_sku, disabled=True)
                with c2:
                    nome_prod = st.text_input("Nome do Produto", placeholder="Ex: Suporte de Headset")
                with c3:
                    categoria_prod = st.selectbox("Categoria", ["DECORAÇÃO", "ORGANIZAÇÃO", "TECH", "UTILITÁRIOS", "OUTROS"])

                c4, c5, c6 = st.columns(3)
                with c4:
                    link_foto = st.text_input("URL da Foto (Opcional)", placeholder="https://...")
                with c5:
                    tempo_horas = st.number_input("Tempo de Impressão (Horas)", min_value=0.0, step=0.5, format="%.2f")
                with c6:
                    peso_gramas = st.number_input("Peso Final (Gramas)", min_value=0.0, step=10.0, format="%.1f")

                st.markdown("---")
                st.subheader("2. Composição Técnica (Insumos / BOM)")
                st.caption("Selecione até 3 insumos principais para calcular o custo automático deste item.")

                # Seletor de Insumos da Tabela de Custos
                opcoes_cus = ["Nenhum"] + [f"{row['ID CUS']} | {row['NOME']} ({row['UNIDADE']})" for _, row in df_custos.iterrows()]

                col_i1, col_i2 = st.columns([3, 1])
                with col_i1:
                    insumo_1 = st.selectbox("Insumo 1 (Filamento principal, etc):", opcoes_cus, index=0)
                with col_i2:
                    qtd_1 = st.number_input("Qtd Insumo 1", min_value=0.0, step=0.1, key="q1")

                col_i3, col_i4 = st.columns([3, 1])
                with col_i3:
                    insumo_2 = st.selectbox("Insumo 2 (Energia / Hora-Máquina, etc):", opcoes_cus, index=0)
                with col_i4:
                    qtd_2 = st.number_input("Qtd Insumo 2", min_value=0.0, step=0.1, key="q2")

                col_i5, col_i6 = st.columns([3, 1])
                with col_i5:
                    insumo_3 = st.selectbox("Insumo 3 (Embalagem / Extra, etc):", opcoes_cus, index=0)
                with col_i6:
                    qtd_3 = st.number_input("Qtd Insumo 3", min_value=0.0, step=0.1, key="q3")

                btn_salvar_produto = st.form_submit_button("🚀 Cadastrar Produto & Gerar Ficha Técnica")

            if btn_salvar_produto:
                if not nome_prod.strip():
                    st.warning("⚠️ O nome do produto é obrigatório!")
                else:
                    try:
                        # Processa Insumos Selecionados
                        itens_tecnicos = []
                        custo_prod_total = 0.0

                        selecionados = [(insumo_1, qtd_1), (insumo_2, qtd_2), (insumo_3, qtd_3)]
                        
                        tecnicos_existentes = aba_tecnico.col_values(1)
                        qtd_tec = len([t for t in tecnicos_existentes if t.strip() and t != "ID TEC"])

                        for insumo_str, qtd in selecionados:
                            if insumo_str != "Nenhum" and qtd > 0:
                                id_cus = insumo_str.split(" | ")[0]
                                row_cus = df_custos[df_custos['ID CUS'] == id_cus].iloc[0]
                                
                                val_unit = extrair_valor_numerico(row_cus['UNIDADE'])
                                custo_item = val_unit * qtd
                                custo_prod_total += custo_item

                                qtd_tec += 1
                                id_tec = f"TEC_{qtd_tec:02d}"

                                # Colunas: ID TEC | ID SKU | ID CUS | TIPO INSUMO | NOME INSUMO | QUANTIDADE | CUSTO ITEM
                                linha_tec = [
                                    id_tec,
                                    proximo_sku,
                                    id_cus,
                                    row_cus['CATEGORIA'],
                                    row_cus['NOME'],
                                    f"{qtd:.2f}",
                                    f"R$ {custo_item:.2f}"
                                ]
                                itens_tecnicos.append(linha_tec)

                        # 1. Salva no Catalogo Tecnico (Filho)
                        if itens_tecnicos:
                            aba_tecnico.append_rows(itens_tecnicos, value_input_option='USER_ENTERED')

                        # 2. Salva no Catalogo (Pai)
                        # Colunas: ID SKU | NOME | CATEGORIA | FOTO | TEMPO | PESO | CUSTO PROD | CUSTO TOTAL
                        custo_total_final = custo_prod_total * 1.10 # Exemplo: 10% margem de segurança/perdas
                        
                        linha_pai = [
                            proximo_sku,
                            nome_prod,
                            categoria_prod,
                            link_foto,
                            f"{tempo_horas:.2f}h",
                            f"{peso_gramas:.1f}g",
                            f"R$ {custo_prod_total:.2f}",
                            f"R$ {custo_total_final:.2f}"
                        ]

                        aba_catalogo.append_row(linha_pai, value_input_option='USER_ENTERED')

                        st.success(f"🎉 Produto **{nome_prod}** (`{proximo_sku}`) cadastrado com sucesso nas duas abas!")
                        st.cache_resource.clear()
                        st.rerun()

                    except Exception as err:
                        st.error(f"🚨 Erro ao cadastrar produto: {err}")


# ==========================================
# 6. PÁGINA 3: VISUALIZAR CATÁLOGOS
# ==========================================
elif pagina == "📊 Visualizar Catálogos":
    st.title("📊 Visão Geral dos Catálogos")
    st.caption("Consulte as tabelas sincronizadas do Google Sheets.")
    st.markdown("---")

    if conexao_ok:
        dados_pai = aba_catalogo.get_all_values()
        dados_filho = aba_tecnico.get_all_values()

        tab_pai, tab_filho = st.tabs(["📦 Catálogo (Pai)", "⚙️ Catálogo Técnico (Filho/BOM)"])

        with tab_pai:
            if len(dados_pai) > 1:
                df_pai = pd.DataFrame(dados_pai[1:], columns=dados_pai[0])
                st.dataframe(df_pai, use_container_width=True, hide_index=True)
            else:
                st.info("Nenhum produto cadastrado no Catálogo Pai.")

        with tab_filho:
            if len(dados_filho) > 1:
                df_filho = pd.DataFrame(dados_filho[1:], columns=dados_filho[0])
                st.dataframe(df_filho, use_container_width=True, hide_index=True)
            else:
                st.info("Nenhum detalhe técnico cadastrado no Catálogo Técnico.")