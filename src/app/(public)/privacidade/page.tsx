// LGPD-001, Política de Privacidade pública.
// Conteúdo derivado do que o sistema realmente coleta e para onde envia,
// verificado nas migrations e nas integrações durante a auditoria.

import { LegalShell, LegalSection, P, List } from "@/components/legal/LegalShell";
import { LEGAL_ENTITY } from "@/lib/legal/entity";

export const metadata = {
  title: "Política de Privacidade",
  description:
    "Como o VOX trata os dados de quem prepara e prega. O que coletamos, por quê, com quem compartilhamos e como você exerce seus direitos.",
};

export default function PrivacidadePage() {
  return (
    <LegalShell
      eyebrow="Documento legal"
      title="Política de Privacidade"
      intro="Esta política explica quais dados o VOX trata, com que finalidade, por quanto tempo e como você exerce os direitos que a Lei Geral de Proteção de Dados (Lei 13.709/2018) lhe garante."
    >
      <LegalSection n={1} title="Quem é o controlador">
        <P>
          O controlador dos dados tratados no VOX é {LEGAL_ENTITY.razaoSocial},
          inscrita sob {LEGAL_ENTITY.documento}, com sede em{" "}
          {LEGAL_ENTITY.endereco}.
        </P>
        <P>
          Para exercer qualquer direito previsto nesta política, ou para falar
          com o Encarregado pelo tratamento de dados, escreva para{" "}
          {LEGAL_ENTITY.emailPrivacidade}.
        </P>
      </LegalSection>

      <LegalSection n={2} title="Dados que tratamos">
        <P>
          Coletamos apenas o necessário para o VOX funcionar. Na prática, são
          quatro grupos:
        </P>
        <List
          items={[
            <>
              <strong>Cadastro.</strong> Nome, e-mail e, quando você informa,
              denominação. O e-mail identifica sua conta e é o canal de acesso.
            </>,
            <>
              <strong>Conteúdo que você cria.</strong> Manuscritos de sermões,
              palestras e aulas, notas, módulos de estudo, séries, cursos,
              slides enviados e preferências do editor. Esse conteúdo é seu.
            </>,
            <>
              <strong>Registros de pregação.</strong> Quando você registra onde
              e quando pregou, guardamos local, data, público estimado e as
              observações que você escrever.
            </>,
            <>
              <strong>Manifestação de interesse.</strong> Se você preencher o
              formulário de interesse antes de ter conta, guardamos nome,
              e-mail, telefone e, por segurança contra abuso, o endereço IP e o
              navegador usados no envio.
            </>,
          ]}
        />
        <P>
          Não usamos cookies de publicidade nem ferramentas de rastreamento de
          terceiros. O único cookie que gravamos é o de sessão, estritamente
          necessário para manter você conectado.
        </P>
      </LegalSection>

      <LegalSection n={3} title="Dado sensível e dado de terceiros">
        <P>
          A LGPD trata convicção religiosa como dado pessoal sensível (art. 5º,
          II). O conteúdo que você escreve no VOX é, por natureza, de convicção
          religiosa, e por isso recebe proteção reforçada: fica restrito à sua
          conta e não é usado para nenhuma finalidade além de lhe prestar o
          serviço.
        </P>
        <P>
          Suas notas podem mencionar outras pessoas, sobretudo em contexto
          pastoral. Você é responsável por esse conteúdo. Recomendamos evitar
          registrar dados identificáveis de terceiros, especialmente informação
          de aconselhamento, saúde ou situação familiar.
        </P>
      </LegalSection>

      <LegalSection n={4} title="Por que tratamos cada dado">
        <List
          items={[
            <>
              <strong>Execução do contrato</strong> (art. 7º, V): cadastro,
              autenticação, armazenamento do seu conteúdo e funcionamento das
              telas de preparação e apresentação.
            </>,
            <>
              <strong>Legítimo interesse</strong> (art. 7º, IX): prevenção de
              abuso e fraude, como o registro de IP no formulário de interesse.
            </>,
            <>
              <strong>Consentimento</strong> (art. 7º, I): uso dos recursos
              opcionais de inteligência artificial, que só são acionados quando
              você os habilita e os utiliza.
            </>,
            <>
              <strong>Obrigação legal</strong> (art. 7º, II): guarda de
              registros exigida por lei.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection n={5} title="Com quem compartilhamos">
        <P>
          Não vendemos seus dados e não os compartilhamos para publicidade.
          Usamos os seguintes operadores para prestar o serviço:
        </P>
        <List
          items={[
            <>
              <strong>Supabase</strong> — banco de dados, autenticação e
              armazenamento dos arquivos que você envia.
            </>,
            <>
              <strong>Vercel</strong> — hospedagem e entrega da aplicação.
            </>,
            <>
              <strong>OpenAI</strong> — processamento dos recursos de
              inteligência artificial, com servidores nos Estados Unidos.
            </>,
            <>
              <strong>A Bíblia Digital</strong> — consulta ao texto bíblico. As
              buscas de referência não levam conteúdo do seu manuscrito.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection n={6} title="Inteligência artificial e envio ao exterior">
        <P>
          Os recursos de IA são opcionais e vêm desligados. Quando você os
          utiliza, trechos do seu manuscrito ou a referência bíblica que você
          escolheu são enviados à OpenAI, nos Estados Unidos, para gerar a
          resposta. Isso é uma transferência internacional de dados (art. 33).
        </P>
        <P>
          Se você não quiser que nenhum conteúdo seu saia do Brasil, mantenha os
          recursos de IA desligados em Configurações. O restante do VOX funciona
          normalmente sem eles.
        </P>
        <P>
          O conteúdo enviado à OpenAI não é usado para treinar modelos, conforme
          a política de uso de API do fornecedor. As exegeses geradas ficam num
          catálogo compartilhado por capítulo — ele guarda o resultado do estudo
          bíblico, nunca o texto do seu manuscrito.
        </P>
      </LegalSection>

      <LegalSection n={7} title="Por quanto tempo guardamos">
        <P>
          Seu conteúdo permanece enquanto sua conta existir. Itens que você
          envia para a lixeira ficam recuperáveis até você excluí-los em
          definitivo.
        </P>
        <P>
          Ao excluir sua conta, apagamos seus dados pessoais e seu conteúdo de
          forma permanente e imediata, incluindo os arquivos enviados. A
          exclusão é irreversível e não há período de recuperação.
        </P>
      </LegalSection>

      <LegalSection n={8} title="Seus direitos">
        <P>
          A LGPD lhe garante, a qualquer momento e sem custo, os direitos de:
        </P>
        <List
          items={[
            "confirmar que tratamos seus dados e acessá-los;",
            "corrigir dados incompletos, inexatos ou desatualizados;",
            "solicitar anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade;",
            "obter a portabilidade dos seus dados;",
            "revogar o consentimento dado aos recursos de IA;",
            "saber com quais operadores compartilhamos seus dados;",
            "peticionar perante a Autoridade Nacional de Proteção de Dados.",
          ]}
        />
        <P>
          Boa parte disso você faz sozinho: corrigir seus dados e desligar a IA
          em Configurações, exportar seus manuscritos pelo botão de exportação,
          e excluir sua conta em Configurações. Para o que não estiver
          disponível na interface, escreva para{" "}
          {LEGAL_ENTITY.emailPrivacidade} — respondemos em até 15 dias.
        </P>
      </LegalSection>

      <LegalSection n={9} title="Segurança">
        <P>
          Todo o tráfego é cifrado em trânsito. O acesso ao seu conteúdo é
          isolado por conta no próprio banco de dados, de modo que um usuário não
          alcança o conteúdo de outro. Os arquivos que você envia ficam em
          armazenamento privado, acessível apenas por links temporários gerados
          para você.
        </P>
        <P>
          Nenhum sistema é infalível. Se ocorrer incidente de segurança com risco
          relevante aos seus direitos, comunicaremos você e a Autoridade Nacional
          de Proteção de Dados, conforme o art. 48.
        </P>
      </LegalSection>

      <LegalSection n={10} title="Mudanças nesta política">
        <P>
          Se alterarmos esta política de forma relevante, avisaremos pelo e-mail
          cadastrado ou por aviso dentro do aplicativo antes de a mudança passar
          a valer. A data da última revisão está no topo desta página.
        </P>
      </LegalSection>
    </LegalShell>
  );
}
