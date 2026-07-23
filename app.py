import streamlit as st
import pandas as pd

# ==========================================
# CONFIGURAÇÃO DA PÁGINA & ESTILO
# ==========================================
st.set_page_config(
    page_title="Print Farm Management System",
    page_icon="🖨️",
    layout="wide"
)

# Estilização customizada (Dark Theme / Clean UI)
st.markdown("""
<style>
    .metric-card {
        background-color: #1E222A;
        padding: 20px;
        border-radius: 10px;
        border-left: 5px solid #00D26A;
        box-shadow: 2px 2px 10px rgba(0,0,0,0.3);
    }
    .stButton>button {
        background-color: #00D26A;
        color: white;
        font-weight: bold;
        border-radius: 6px;
        height: 45px;
        width: 100%;
    }
</style>
""", unsafe_allow_html=True)

# ==========================================
# SIMULAÇÃO DA BASE DE DADOS (GOOGLE SHEETS)
# ==========================================
@st.cache_data
def load_data():
    # Tabela de Custos (Mestre de Insumos)
    df_custos = pd.DataFrame([
        {"ID_CUS": "CUS_01", "CATEGORIA": "ENERGIA", "NOME": "Tarifa kWh", "UNIDADE": "R$/kWh", "VALOR": 0.76},
        {"ID_CUS": "CUS_02", "CATEGORIA": "FILAMENTO", "NOME": "PLA Padrão", "UNIDADE": "R$/kg", "VALOR": 88.74},
        {"ID_CUS": "CUS_03", "CATEGORIA": "FILAMENTO", "NOME": "ABS Padrão", "UNIDADE": "R$/kg", "VALOR": 52.20},
        {"ID_CUS": "CUS_04", "CATEGORIA": "FILAMENTO", "NOME": "PETG Padrão", "UNIDADE": "R$/kg", "VALOR": 88.74},
        {"ID_CUS": "CUS_05", "CATEGORIA": "FILAMENTO", "NOME": "TPU Padrão", "UNIDADE": "R$/kg", "VALOR": 135.72},
        {"ID_CUS": "CUS_07", "CATEGORIA": "OPERAÇÃO", "NOME": "MÉD DEPREC P/HORA", "UNIDADE": "R$/h", "VALOR": 0.58},
        {"ID_CUS": "CUS_08", "CATEGORIA": "OPERAÇÃO", "NOME": "MÉD MANUT P/HORA", "UNIDADE": "R$/h", "VALOR": 0.70},
    ])
    
    # Catálogo de Produtos (SKUs)
    df_skus = pd.DataFrame([
        {"ID_SKU": "SKU_001", "NOME_PRODUTO": "Suporte Headset Gamer", "TEMPO_IMP_MIN": 180, "PESO_G": 120, "CUSTO_TOTAL": 16.45},
        {"ID_SKU": "SKU_002", "NOME_PRODUTO": "Vaso Decorativo Geométrico", "TEMPO_IMP_MIN": 240, "PESO_G": 210, "CUSTO_TOTAL": 24.80},
        {"ID_SKU": "SKU_003", "NOME_PRODUTO": "Organizador de Cabos", "TEMPO_IMP_MIN": 45, "PESO_G": 30, "CUSTO_TOTAL": 4.10},
    ])

    return df_custos, df_skus

df_custos, df_skus = load_data()

# ==========================================
# BARRA LATERAL (NAVEGAÇÃO)
# ==========================================
st.sidebar.title("🖨️ PrintFarm OS")
st.sidebar.markdown("---")
menu = st.sidebar.radio(
    "Navegação",
    ["📊 Dashboard Executivo", "📝 Nova Ficha Técnica (BOM)", "📦 Catálogo de SKUs", "⚙️ Tabela de Custos / Insumos"]
)

# ==========================================
# 1. DASHBOARD EXECUTIVO
# ==========================================
if menu == "📊 Dashboard Executivo":
    st.title("📊 Painel de Controle da Print Farm")
    st.caption("Visão geral de custos, produção e catálogo técnico")
    st.markdown("---")

    # KPIs / Indicadores Principais
    c1, c2, c3, c4 = st.columns(4)
    with c1:
        st.markdown(f"<div class='metric-card'><h4>Total de SKUs</h4><h2>{len(df_skus)}</h2></div>", unsafe_allow_html=True)
    with c2:
        custo_medio = df_skus["CUSTO_TOTAL"].mean()
        st.markdown(f"<div class='metric-card'><h4>Custo Médio / Peça</h4><h2>R$ {custo_medio:.2f}</h2></div>", unsafe_allow_html=True)
    with c3:
        tempo_medio = df_skus["TEMPO_IMP_MIN"].mean() / 60
        st.markdown(f"<div class='metric-card'><h4>Tempo Médio Impressão</h4><h2>{tempo_medio:.1f} hrs</h2></div>", unsafe_allow_html=True)
    with c4:
        filamento_kg = df_custos[df_custos['CATEGORIA']=='FILAMENTO']['VALOR'].mean()
        st.markdown(f"<div class='metric-card'><h4>Média R$/Kg Filamento</h4><h2>R$ {filamento_kg:.2f}</h2></div>", unsafe_allow_html=True)

    st.markdown("<br>", unsafe_allow_html=True)

    # Gráficos em duas colunas
    col_g1, col_g2 = st.columns(2)
    with col_g1:
        st.subheader("💰 Custo Estimado por SKU (R$)")
        st.bar_chart(df_skus.set_index("NOME_PRODUTO")["CUSTO_TOTAL"], color="#00D26A")

    with col_g2:
        st.subheader("⏱️ Tempo de Impressão por SKU (Minutos)")
        st.bar_chart(df_skus.set_index("NOME_PRODUTO")["TEMPO_IMP_MIN"], color="#3182CE")

# ==========================================
# 2. NOVA FICHA TÉCNICA (BOM INVERSE DROPDOWN)
# ==========================================
elif menu == "📝 Nova Ficha Técnica (BOM)":
    st.title("📝 Montar Ficha Técnica de Produto")
    st.caption("Cadastre a composição de insumos sem precisar decorar IDs de insumos.")
    st.markdown("---")

    col_sku, col_nome = st.columns([1, 3])
    with col_sku:
        sku_id = st.text_input("ID do SKU", value=f"SKU_00{len(df_skus)+1}")
    with col_nome:
        sku_nome = st.text_input("Nome do Produto / Peça 3D", placeholder="Ex: Action Figure Articulado")

    st.subheader("Selecione os Insumos do Produto")

    # Form de Adição de Insumo com Filtro Inteligente
    c_cat, c_insumo, c_qtd, c_add = st.columns([2, 3, 2, 1])

    with c_cat:
        # Step 1: Filtra por Categoria
        categorias = df_custos["CATEGORIA"].unique()
        categoria_sel = st.selectbox("1. Tipo de Insumo", categorias)

    with c_insumo:
        # Step 2: Mostra apenas insumos da categoria selecionada!
        insumos_filtrados = df_custos[df_custos["CATEGORIA"] == categoria_sel]
        nome_insumo_sel = st.selectbox("2. Nome do Insumo", insumos_filtrados["NOME"].tolist())

    # Descobre o ID por trás do Nome automaticamente!
    id_insumo_real = insumos_filtrados[insumos_filtrados["NOME"] == nome_insumo_sel]["ID_CUS"].values[0]
    unidade_real = insumos_filtrados[insumos_filtrados["NOME"] == nome_insumo_sel]["UNIDADE"].values[0]
    valor_unit_real = insumos_filtrados[insumos_filtrados["NOME"] == nome_insumo_sel]["VALOR"].values[0]

    with c_qtd:
        qtd_usada = st.number_input(f"3. Quantidade ({unidade_real})", min_value=0.0, value=100.0, step=1.0)

    # Cálculo do Custo do Item
    if "FILAMENTO" in categoria_sel:
        custo_calculado = (valor_unit_real / 1000) * qtd_usada  # Converte Kg pra grama
    else:
        custo_calculado = valor_unit_real * qtd_usada

    st.info(f"🔑 **ID Registrado no Banco:** `{id_insumo_real}` | 💵 **Custo Calculado deste item:** R$ {custo_calculado:.2f}")

    if st.button("➕ Adicionar Insumo à Ficha Técnica"):
        st.success(f"Insumo **{nome_insumo_sel}** (`{id_insumo_real}`) adicionado com sucesso ao {sku_nome}!")

# ==========================================
# 3. VISUALIZAÇÃO DE TABELAS
# ==========================================
elif menu == "📦 Catálogo de SKUs":
    st.title("📦 Catálogo Técnico de Produtos")
    st.dataframe(df_skus, use_container_width=True)

elif menu == "⚙️ Tabela de Custos / Insumos":
    st.title("⚙️ Tabela Mestre de Custos & Parâmetros")
    st.dataframe(df_custos, use_container_width=True)