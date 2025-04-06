// components/ButtonNFE.jsx
import React, { useState } from 'react';
import { Button, CircularProgress } from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

const ButtonNFE = ({
  status,              // "Pago" habilita o botão
  installmentNumber,   // Número da parcela (usado em rpsNumber e externalId)
  nome,                // Nome do cliente (usado em borrower)
  nomeViagem,          // Nome da viagem (usado em externalId e description)
  valorViagem,         // Valor total da viagem (usado em servicesAmount)
  onSuccess,           // Callback para sucesso
  onError              // Callback para erro
}) => {
  const [loading, setLoading] = useState(false);

  const handleEmitNFE = async () => {
    if (status !== "Pago") return;
    setLoading(true);

    // Monta o payload completo conforme o schema da documentação
    const now = new Date().toISOString();
    const payload = {
      id: "", // Pode ser vazio ou gerado internamente
      environment: "Development",
      flowStatus: "CancelFailed",
      flowMessage: "string",
      provider: {
        tradeName: "Minha Empresa",
        openningDate: now,
        taxRegime: "Isento",
        specialTaxRegime: "Automatico",
        legalNature: "EmpresaPublica",
        economicActivities: [
          {
            type: "Main",
            code: 0
          }
        ],
        companyRegistryNumber: 0,
        regionalTaxNumber: 0,
        municipalTaxNumber: "string",
        issRate: 0,
        federalTaxDetermination: "NotInformed",
        municipalTaxDetermination: "NotInformed",
        loginName: "string",
        loginPassword: "string",
        authIssueValue: "string",
        parentId: "string",
        id: "string",
        name: "Minha Empresa",
        federalTaxNumber: 0,
        email: "empresa@exemplo.com",
        address: {
          country: "BRA",
          postalCode: "00000-000",
          street: "Rua da Empresa",
          number: "100",
          additionalInformation: "Sala 101",
          district: "Centro",
          city: {
            code: "3550308",
            name: "São Paulo",
            state: "SP"
          },
          status: "Inactive",
          type: "Undefined",
          createdOn: now,
          modifiedOn: now
        }
      },
      borrower: {
        parentId: "string",
        id: "string",
        name: nome,
        federalTaxNumber: "11444777000161",  // Use um CNPJ/CPF fictício ou real, se disponível
        email: "cliente@exemplo.com",
        address: {
          country: "BRA",
          postalCode: "00000-000",
          street: "Não Informado",
          number: "Não Informado",
          additionalInformation: "",
          district: "Não Informado",
          city: {
            code: "3106200",
            name: "Não Informado",
          },        
          state: "MG",
          status: "Inactive",
          type: "Undefined",
          createdOn: now,
          modifiedOn: now
        }
      },
      externalId: `NF-${nomeViagem}-${installmentNumber}`,
      batchNumber: 0,
      batchCheckNumber: "string",
      number: installmentNumber,
      checkCode: "string",
      status: "Error",
      rpsType: "Rps",
      rpsStatus: "Normal",
      taxationType: "None",
      issuedOn: now,
      cancelledOn: now,
      rpsSerialNumber: "0001",
      rpsNumber: installmentNumber,
      cityServiceCode: "090200188",         // Preencha com um código válido
      federalServiceCode: "9.02",        // Preencha com um código válido
      description: `Serviço de ${nomeViagem} - parcela ${installmentNumber}`,
      servicesAmount: valorViagem,
      deductionsAmount: 0,
      discountUnconditionedAmount: 0,
      discountConditionedAmount: 0,
      baseTaxAmount: 0,
      issRate: 0,
      issTaxAmount: 0,
      irAmountWithheld: 0,
      pisAmountWithheld: 0,
      cofinsAmountWithheld: 0,
      csllAmountWithheld: 0,
      inssAmountWithheld: 0,
      issAmountWithheld: 0,
      othersAmountWithheld: 0,
      amountWithheld: 0,
      amountNet: 0,
      location: {
        state: "SP",
        country: "BRA",
        postalCode: "00000-000",
        street: "Rua Exemplo",
        number: "0",
        district: "Centro",
        AdditionalInformation: "string",
        city: {
          code: "3550308",
          name: "São Paulo"
        }
      },
      activityEvent: {
        name: "Serviço de Viagem",
        startOn: now,
        endOn: now,
        atvEvId: "EVT001"
      },
      approximateTax: {
        source: "string",
        version: "string",
        totalRate: 0
      },
      additionalInformation: "Emitida via integração Quovadis",
      createdOn: now,
      modifiedOn: now
    };

    try {
      const response = await fetch('/api/NFE.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (!response.ok) {
        console.error("Erro ao emitir NF-e:", result.error, result.details);
        if (onError) onError(result.error);
      } else {
        console.log("NF-e emitida com sucesso:", result);
        if (onSuccess) onSuccess(result);
      }
    } catch (err) {
      console.error("Erro na requisição da NF-e:", err);
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="contained"
      color="primary"
      size="small"
      startIcon={<ReceiptLongIcon fontSize="small" />}
      sx={{
        borderRadius: 1,
        visibility: status === "Pago" ? "visible" : "hidden",
      }}
      onClick={handleEmitNFE}
      disabled={loading || status !== "Pago"}
    >
      {loading ? <CircularProgress size={16} color="inherit" /> : "Emitir NF-e"}
    </Button>
  );
};

export default ButtonNFE;
