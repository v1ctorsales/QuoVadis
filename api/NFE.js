// pages/api/NFE.js
export default async function handler(req, res) {
    res.setHeader('Content-Type', 'application/json');
  
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ error: 'Método não permitido.' });
    }
  
    const payload = req.body;
  
    // Validação dos campos obrigatórios conforme a estrutura completa
    if (
      !payload.provider ||
      !payload.borrower ||
      !payload.externalId ||
      !payload.rpsNumber ||
      !payload.description ||
      payload.servicesAmount == null
    ) {
      return res.status(400).json({
        error: "Dados insuficientes para emissão da NF-e. Verifique os dados enviados."
      });
    }
  
    const companyId = process.env.NFE_COMPANY_ID; // Ex: "67e47f31f2f80c11b4db0d25"
    const apiKey = process.env.NFE_APIKEY; // Ex: "QAJstGimVGTevFn4CJykUrbaIC4xY8idWiseIl8MXTk3CpsBfg8WhBvfjz2ahLGFwcB"
    const nfeEndpoint = `https://api.nfe.io/v1/companies/${companyId}/serviceinvoices`;
  
    try {
      const nfeResponse = await fetch(nfeEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      });
  
      // Em vez de chamar diretamente nfeResponse.json(), lemos o corpo como texto
      const text = await nfeResponse.text();
      let result = {};
      try {
        if (text) {
          result = JSON.parse(text);
        }
      } catch (parseError) {
        console.error("Erro ao parsear JSON:", parseError);
      }
  
      if (!nfeResponse.ok) {
        return res.status(nfeResponse.status).json({
          error: result.error || "Erro na emissão da NF-e",
          details: result
        });
      }
  
      return res.status(202).json({
        message: "NF-e emitida com sucesso e enviada para fila de emissão.",
        data: result
      });
    } catch (error) {
      console.error("Erro ao emitir NF-e:", error);
      return res.status(500).json({
        error: "Erro interno ao emitir NF-e."
      });
    }
  }
  