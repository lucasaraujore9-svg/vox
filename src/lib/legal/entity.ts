/**
 * Dados do controlador para os documentos legais (/termos e /privacidade).
 *
 * ⚠️ PREENCHER ANTES DE COBRAR DE QUALQUER CLIENTE.
 * Enquanto qualquer campo abaixo contiver o marcador `[PREENCHER: ...]`, as
 * páginas legais exibem um aviso de rascunho no topo. Isso é proposital: evita
 * publicar um documento pela metade sem perceber.
 *
 * Os documentos foram redigidos a partir do que o sistema REALMENTE faz
 * (tabelas, integrações e fluxos verificados na auditoria de 2026-08-12).
 * Ainda assim, texto jurídico deve passar por revisão de advogado antes de
 * virar instrumento contratual.
 */

export const LEGAL_ENTITY = {
  /** Razão social do controlador. Ex.: "Fulano de Tal Serviços Digitais Ltda." */
  razaoSocial: "[PREENCHER: razão social]",
  /** CNPJ ou CPF do controlador. */
  documento: "[PREENCHER: CNPJ]",
  /** Endereço completo do controlador. */
  endereco: "[PREENCHER: endereço]",
  /** Canal do Encarregado (DPO) para o titular exercer direitos — LGPD art. 41. */
  emailPrivacidade: "[PREENCHER: e-mail de privacidade]",
  /** Comarca do foro eleito nos Termos de Uso. */
  foro: "[PREENCHER: comarca/UF]",
} as const;

/** Data da última revisão dos documentos. Atualize ao alterar o texto. */
export const LEGAL_UPDATED_AT = "12 de agosto de 2026";

/** Versão dos documentos. Registre-a junto do aceite do usuário. */
export const LEGAL_VERSION = "1.0";

/** True enquanto houver campo não preenchido acima. */
export const LEGAL_ENTITY_INCOMPLETE = Object.values(LEGAL_ENTITY).some((v) =>
  v.startsWith("[PREENCHER")
);
