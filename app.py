import streamlit as st
import pandas as pd
import gspread
from oauth2client.service_account import ServiceAccountCredentials

# ==========================================
# 1. CONFIGURAÇÃO DA PÁGINA
# ==========================================
st.set_page_config(
    page_title="Cadastro de Insumos - Shard OS",
    page_icon="⚙️",
    layout="wide"
)

# ==========================================
# 2. CONEXÃO COM GOOGLE SHEETS VIA GSPREAD
# ==========================================
@st.cache_resource
def conectar_google_sheets():
    scope = [
        "https://spreadsheets.google.com/feeds",
        "https://www.googleapis.com/auth/drive"
    ]
    # Carrega suas credenciais do arquivo baixado
    creds = ServiceAccountCredentials.from_json_keyfile_name("credentials.json", scope)
    client = gspread.authorize(creds)
    return client

try:
    client = conectar_google_sheets()
    # Cole o ID da sua planilha abaixo:
    ID_PLANILHA = "1QL0jnPnw-3H5OMwc-jUmSKiTnp7PsnLx7x2bdYOyyVw"
    
    spreadsheet = client.open_by_key(ID_PLANILHA)
    aba_custos = spreadsheet.worksheet("Tabela de Custos")
    conexao_ok = True
except Exception as e:
    conexao_ok = False
    st.error(f"Erro ao conectar com o Google Sheets: {e}")

# ==========================================
# 3. INTERFACE DE CADASTRO DE INSUMOS
# ==========================================
st.title("⚙️ Cadastro Mestre de Insumos & Custos")
st.caption("Cadastre novos materiais e taxas que serão usados no cálculo das Fichas Técnicas.")
st.markdown("---")

if conexao_ok:
    # Carrega dados atuais
    dados_atuais = aba_custos.get_all_records()
    df_custos = pd.DataFrame(dados_atuais)

    # Lógica para gerar o próximo ID automático (Ex: CUS_11)
    qtd_itens = len(df_custos) + 1
    proximo_id = f"CUS_{qtd_itens:02d}"

    # FORMULÁRIO DE CADASTRO
    with st.form("form_novo_insumo", clear_on_submit=True):
        st.subheader("➕ Adicionar Novo Insumo")
        
        col1, col2, col3 = st.columns([1, 2, 2])
        
        with col1:
            id_cus = st.text_input("ID Insumo (Gerado)", value=proximo_id, disabled=True)
            
        with col2:
            categoria = st.selectbox(
                "Categoria do Insumo",
                ["FILAMENTO", "ENERGIA", "OPERAÇÃO", "EMBALAGEM", "PÓS-PROCESSAMENTO", "OUTROS"]
            )
            
        with col3:
            nome = st.text_input("Nome do Insumo", placeholder="Ex: PLA Silk Gold 1kg")

        col4, col5 = st.columns(2)
        
        with col4:
            unidade = st.selectbox(
                "Unidade de Medida",
                ["R$/kg", "R$/kWh", "R$/h", "R$/unid", "%"]
            )
            
        with col5:
            valor = st.number_input("Valor / Custo Unitário (R$)", min_value=0.0, step=0.50, format="%.2f")

        btn_cadastrar = st.form_submit_button("🚀 Salvar Insumo no Google Sheets")

    # AÇÃO DE SALVAR NO GOOGLE SHEETS
    if btn_cadastrar:
        if not nome:
            st.warning("⚠️ Por favor, preencha o Nome do Insumo antes de salvar.")
        else:
            try:
                # Prepara a nova linha exatamente na ordem das suas colunas: ID, CATEGORIA, NOME, UNIDADE, VALOR
                nova_linha = [proximo_id, categoria, nome, f"{unidade} {valor:.2f}".replace('.', ',') if "R$" in unidade else valor]
                
                # Envia para a planilha
                aba_custos.append_row([proximo_id, categoria, nome, unidade, valor])
                
                st.success(f"✅ Insumo **{nome}** (`{proximo_id}`) cadastrado com sucesso!")
                
                # Recarrega a página para atualizar a tabela na tela
                st.rerun()
            except Exception as err:
                st.error(f"Erro ao salvar no Google Sheets: {err}")

    st.markdown("---")
    
    # EXIBIÇÃO DA TABELA ATUAL
    st.subheader("📋 Insumos Cadastrados (Tabela de Custos)")
    if not df_custos.empty:
        st.dataframe(df_custos, use_container_width=True)
    else:
        st.info("Nenhum insumo encontrado na aba 'Tabela de Custos'.")