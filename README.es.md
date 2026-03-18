# Nexus Finance Tracker 🚀

[🇺🇸 Read in English](README.md)

**Nexus Finance Tracker** no es otra típica aplicación para anotar gastos; es un **centro integral de Gestión Patrimonial con arquitectura "Local-First"**. Diseñado específicamente para cambiar el enfoque de "solo registrar tickets" a "construir riqueza a largo plazo", Nexus ofrece métricas de portafolio de grado institucional, seguimiento de metas y un consultor financiero de Inteligencia Artificial integrado—todo mientras mantiene tu información 100% privada en tu navegador.

### 🌟 Filosofía Principal

La mayoría de las apps financieras tratan a los usuarios como consumidores. Nexus te trata como un *inversor*. En lugar de retarte por comprar un café, calcula la Tasa de Rendimiento Ponderada en el Tiempo (TWRR) de tu portafolio, proyecta tu patrimonio hacia el futuro y audita tus gastos utilizando un Mentor IA implacable (y completamente privado).

### 🚀 Funcionalidades Principales

*   🔒 **Arquitectura 100% Local-First:** Tu plata, tus datos. Nexus corre completamente en el navegador usando `localStorage`. Sin sincronización en la nube, sin bases de datos externas, sin rastreo. Privacidad total.
*   🧠 **Nexus AI Advisor:** Se conecta directamente a **Ollama** (corriendo localmente en tu máquina) para una auditoría financiera privada. Hacé preguntas o pedí un análisis de tus patrones de gastos sin enviar datos a servidores externos.
*   📈 **Métricas de Inversión Institucionales:** Trackeá tu portafolio en múltiples clases de activos (Cripto, Acciones, Bonos). Incluye cálculo automático de TWRR, ROI y un motor de rebalanceo de "Target Allocation".
*   🔮 **Proyecciones y Simulador de Riqueza:** Corré modelos de interés compuesto a 1, 2 o 5 años basados en tu TWRR histórico para proyectar tu camino hacia la independencia financiera.
*   🎯 **Monitoreo Granular de Metas:** Mapeá tus ahorros a objetivos específicos con soporte multimoneda.
*   🔄 **Motor de Portabilidad de Datos:** Exportá todo tu estado financiero a un archivo de backup `.json` o importalo a cualquier otro dispositivo corriendo Nexus. Nunca estás atado (No Vendor Lock-in).
*   🌐 **Motor Bilingüe:** Completamente localizado en Inglés y Español Neutro de forma dinámica.

### 🛠️ Stack Tecnológico

*   **Core:** React 18, TypeScript, Vite
*   **Manejo de Estado:** Zustand (con Middleware de Persistencia)
*   **Estilos y UI:** Tailwind CSS, Íconos de Lucide
*   **Gráficos y Visualización:** Recharts
*   **Internacionalización:** `i18next` y `react-i18next`
*   **Integración de IA:** Puente nativo vía `fetch` hacia la API local de Ollama (Llama3.1)

### 🏁 Cómo Empezar

1.  **Cloná el repositorio:**
    ```bash
    git clone https://github.com/yourusername/nexus-finance.git
    cd nexus-finance
    ```
2.  **Instalá las dependencias:**
    ```bash
    npm install
    ```
3.  **Levantá el servidor local:**
    ```bash
    npm run dev
    ```
4.  *(Opcional)* **Conectá la IA:** Asegurate de tener [Ollama](https://ollama.com/) corriendo en tu máquina con un modelo activo (por defecto: `llama3.1`). El Nexus Advisor se va a conectar automáticamente escuchando en `http://localhost:11434`.

---
<div align="center">
  <i>Construído con React, TypeScript y sentido común financiero.</i>
</div>
