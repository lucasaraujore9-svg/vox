// LGPD-001, Termos de Uso públicos.

import Link from "next/link";
import { LegalShell, LegalSection, P, List } from "@/components/legal/LegalShell";
import { LEGAL_ENTITY } from "@/lib/legal/entity";

export const metadata = {
  title: "Termos de Uso",
  description:
    "As regras do VOX: o que oferecemos, o que esperamos de você, de quem é o conteúdo e como a assinatura funciona.",
};

export default function TermosPage() {
  return (
    <LegalShell
      eyebrow="Documento legal"
      title="Termos de Uso"
      intro="Estes termos regem o uso do VOX. Ao criar uma conta ou usar o serviço, você concorda com eles. Escrevemos em português claro de propósito: você precisa entender o que está aceitando."
    >
      <LegalSection n={1} title="Quem somos e o que o VOX faz">
        <P>
          O VOX é operado por {LEGAL_ENTITY.razaoSocial}, inscrita sob{" "}
          {LEGAL_ENTITY.documento}, com sede em {LEGAL_ENTITY.endereco}.
        </P>
        <P>
          O VOX é uma ferramenta de preparação, entrega e arquivo de conteúdo
          pastoral: sermões, palestras e aulas. Oferece modelos homiléticos,
          editor com blocos, consulta bíblica, modos de apresentação e, de forma
          opcional, recursos de inteligência artificial.
        </P>
      </LegalSection>

      <LegalSection n={2} title="Conta e acesso">
        <P>
          O acesso ao VOX é concedido por convite. Você é responsável por manter
          sua senha em sigilo e por tudo que acontecer na sua conta. Avise-nos
          imediatamente se suspeitar de uso não autorizado.
        </P>
        <P>
          Você deve ter capacidade civil para contratar e fornecer informações
          verdadeiras no cadastro. Contas podem ser desativadas em caso de
          violação destes termos.
        </P>
      </LegalSection>

      <LegalSection n={3} title="O conteúdo é seu">
        <P>
          Tudo que você escreve, envia ou cria no VOX continua sendo seu. Não
          reivindicamos propriedade sobre seus manuscritos, notas ou arquivos, e
          não os usamos para nenhuma finalidade além de lhe prestar o serviço.
        </P>
        <P>
          Você nos concede apenas a licença técnica necessária para armazenar,
          processar e exibir esse conteúdo para você — o mínimo para o produto
          funcionar. Essa licença termina quando você apaga o conteúdo ou a
          conta.
        </P>
        <P>
          Você é responsável pelo que publica e deve ter direito sobre o material
          que envia, inclusive imagens e apresentações de terceiros.
        </P>
      </LegalSection>

      <LegalSection n={4} title="Uso aceitável">
        <P>Ao usar o VOX, você concorda em não:</P>
        <List
          items={[
            "enviar conteúdo ilegal, difamatório, ou que viole direito de terceiro;",
            "tentar acessar dados ou contas que não sejam seus;",
            "sondar, burlar ou testar as proteções do sistema sem autorização escrita;",
            "automatizar uso de forma a degradar o serviço para os demais;",
            "revender ou sublicenciar o acesso ao VOX sem autorização.",
          ]}
        />
      </LegalSection>

      <LegalSection n={5} title="Recursos de inteligência artificial">
        <P>
          Os recursos de IA são opcionais, vêm desligados e podem ter limites de
          uso. Quando você os aciona, parte do seu conteúdo é enviada a um
          fornecedor externo para processamento, conforme detalhado na{" "}
          <Link
            href="/privacidade"
            className="text-vox-forest underline underline-offset-4"
          >
            Política de Privacidade
          </Link>
          .
        </P>
        <P>
          O resultado gerado por IA é material de apoio ao seu estudo, não
          verdade estabelecida. A responsabilidade teológica e pastoral pelo que
          você prega é inteiramente sua. Revise sempre antes de usar no púlpito.
        </P>
      </LegalSection>

      <LegalSection n={6} title="Planos e pagamento">
        <P>
          O VOX pode oferecer plano gratuito e planos pagos, com recursos e
          limites distintos, informados no momento da contratação.
        </P>
        <P>
          Quando houver cobrança, ela será recorrente conforme o período
          escolhido, com renovação automática até que você cancele. O
          cancelamento interrompe as cobranças seguintes e o acesso pago
          permanece até o fim do período já pago. Preços podem mudar mediante
          aviso prévio de 30 dias.
        </P>
        <P>
          Você pode desistir da contratação em até 7 dias, com devolução
          integral, conforme o art. 49 do Código de Defesa do Consumidor.
        </P>
      </LegalSection>

      <LegalSection n={7} title="Disponibilidade">
        <P>
          Trabalhamos para manter o VOX disponível, mas não garantimos operação
          ininterrupta. Pode haver manutenção programada, indisponibilidade de
          fornecedores ou falhas.
        </P>
        <P>
          O VOX não substitui seu próprio backup. Se um manuscrito é essencial
          para o seu domingo, exporte-o. A função de exportação existe
          exatamente para isso.
        </P>
      </LegalSection>

      <LegalSection n={8} title="Encerramento">
        <P>
          Você pode encerrar sua conta a qualquer momento em Configurações. A
          exclusão apaga seus dados e seu conteúdo de forma permanente e
          imediata, sem período de recuperação. Exporte o que quiser guardar
          antes.
        </P>
        <P>
          Podemos suspender ou encerrar contas que violem estes termos, com
          aviso prévio sempre que possível.
        </P>
      </LegalSection>

      <LegalSection n={9} title="Limitação de responsabilidade">
        <P>
          O VOX é fornecido no estado em que se encontra. Na máxima extensão
          permitida pela lei brasileira, nossa responsabilidade fica limitada ao
          valor pago por você nos 12 meses anteriores ao evento.
        </P>
        <P>
          Nada nestes termos afasta direitos que o Código de Defesa do
          Consumidor lhe garante como consumidor.
        </P>
      </LegalSection>

      <LegalSection n={10} title="Alterações e foro">
        <P>
          Podemos alterar estes termos. Mudanças relevantes serão comunicadas
          pelo e-mail cadastrado ou dentro do aplicativo antes de passarem a
          valer. Continuar usando o VOX depois disso significa aceitar a nova
          versão.
        </P>
        <P>
          Estes termos são regidos pela lei brasileira. Fica eleito o foro da
          comarca de {LEGAL_ENTITY.foro}, sem prejuízo do direito do consumidor
          de demandar no foro de seu domicílio.
        </P>
      </LegalSection>
    </LegalShell>
  );
}
