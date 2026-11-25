export const metadata = {
  title: 'Política de Privacidade | Maratonei App',
  description: 'Entenda quais dados o Maratonei App trata, para quais finalidades, como funcionam os serviços do Google e como exercer seus direitos de privacidade.',
  alternates: { canonical: 'https://maratoneiapp.com.br/politica-de-privacidade' },
}

const section = { marginBottom: 28 }
const heading = {
  color: '#FACC15',
  fontSize: 18,
  fontWeight: 800,
  margin: '0 0 10px',
}
const paragraph = {
  color: '#C5CEE0',
  fontSize: 14,
  lineHeight: 1.75,
  margin: '0 0 12px',
}
const list = {
  color: '#C5CEE0',
  fontSize: 14,
  lineHeight: 1.8,
  paddingLeft: 22,
  margin: '8px 0 12px',
}

export default function PoliticaDePrivacidade() {
  return (
    <main style={{ minHeight: '100vh', background: '#080E1F', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif', padding: '32px 18px 56px' }}>
      <article style={{ maxWidth: 820, margin: '0 auto' }}>
        <a href="/" style={{ color: '#FACC15', textDecoration: 'none', fontSize: 13, fontWeight: 800 }}>← Voltar ao Maratonei</a>
        <header style={{ padding: '34px 0 26px', borderBottom: '1px solid #ffffff18', marginBottom: 28 }}>
          <div style={{ color: '#FACC15', fontSize: 11, fontWeight: 900, letterSpacing: 2, marginBottom: 10 }}>MARATONEI APP</div>
          <h1 style={{ fontSize: 'clamp(28px, 6vw, 42px)', lineHeight: 1.12, letterSpacing: -1.2, margin: '0 0 12px', fontWeight: 900 }}>Política de Privacidade</h1>
          <p style={{ ...paragraph, margin: 0 }}>Última atualização: 24 de novembro de 2026</p>
        </header>

        <section style={section}>
          <h2 style={heading}>1. Quem somos e a quem esta política se aplica</h2>
          <p style={paragraph}>O Maratonei App é uma plataforma digital independente para organizar filmes e séries, acompanhar temporadas e episódios, registrar o que você assiste e interagir com outros fãs. Esta política explica como os dados pessoais são tratados quando você acessa ou utiliza o site e os recursos do Maratonei em maratoneiapp.com.br.</p>
          <p style={paragraph}>O responsável pelo serviço pode ser contatado pelo e-mail <a href="mailto:contatomaratoneiapp@gmail.com" style={{ color: '#FACC15' }}>contatomaratoneiapp@gmail.com</a>. Use esse endereço para dúvidas, solicitações sobre seus dados ou exercício dos direitos previstos na legislação de proteção de dados.</p>
        </section>

        <section style={section}>
          <h2 style={heading}>2. Dados que tratamos</h2>
          <p style={paragraph}>Os dados tratados dependem dos recursos que você utiliza. Eles podem incluir:</p>
          <ul style={list}>
            <li><strong>Conta e autenticação:</strong> identificador da conta, endereço de e-mail e informações básicas de perfil disponibilizadas quando você entra com o Google, como nome e foto de perfil.</li>
            <li><strong>Perfil:</strong> nome de exibição, nome de usuário, foto, biografia e outras informações que você decide inserir.</li>
            <li><strong>Atividade no aplicativo:</strong> filmes e séries adicionados às listas, status de acompanhamento, episódios concluídos, progresso, avaliações, check-ins, comentários, reações, curtidas e relações de seguidores e seguindo.</li>
            <li><strong>Preferências:</strong> configurações da conta e escolhas relacionadas às notificações por e-mail.</li>
            <li><strong>Dados técnicos:</strong> informações de sessão, navegador, dispositivo, registros técnicos e dados necessários para autenticação, segurança, prevenção de abuso e diagnóstico de falhas.</li>
            <li><strong>Dados armazenados no dispositivo:</strong> determinadas preferências e informações de funcionamento podem ser mantidas no armazenamento local do navegador.</li>
          </ul>
        </section>

        <section style={section}>
          <h2 style={heading}>3. Perfis, listas e atividades públicas</h2>
          <p style={paragraph}>O Maratonei possui recursos sociais. Informações exibidas como públicas no perfil e no feed — que podem incluir nome de exibição, foto, biografia, check-ins, filmes e séries acompanhados, progresso de episódios e atividades ou interações publicadas — podem ser visualizadas por outras pessoas que acessam essas áreas do aplicativo.</p>
          <p style={paragraph}>Ao publicar conteúdo ou utilizar recursos sociais, considere que essas informações podem ficar visíveis a outros usuários. Não inclua nos campos públicos informações que você não deseja compartilhar. Comentários e interações podem permanecer associados ao conteúdo correspondente enquanto estiverem disponíveis no serviço, ressalvadas solicitações de remoção e obrigações legais.</p>
        </section>

        <section style={section}>
          <h2 style={heading}>4. Para que usamos os dados</h2>
          <ul style={list}>
            <li>Criar, autenticar e manter sua conta.</li>
            <li>Salvar e sincronizar listas, filmes, séries e progresso de episódios.</li>
            <li>Exibir perfis, check-ins, feed, comentários e demais funcionalidades sociais.</li>
            <li>Salvar suas preferências e enviar comunicações relacionadas ao serviço.</li>
            <li>Operar, proteger, manter e corrigir o aplicativo.</li>
            <li>Compreender o uso do serviço e melhorar suas funcionalidades.</li>
            <li>Cumprir obrigações legais e responder a solicitações legítimas de autoridades.</li>
          </ul>
          <p style={paragraph}>Não vendemos dados pessoais. Não utilizamos dados obtidos por meio das APIs do Google para publicidade, criação de perfis publicitários ou finalidades incompatíveis com as funcionalidades descritas nesta política.</p>
        </section>

        <section style={section}>
          <h2 style={heading}>5. Login com Google</h2>
          <p style={paragraph}>Se você escolher “Entrar com Google”, o Google realiza a autenticação e compartilha com o Maratonei as informações básicas autorizadas no fluxo de login, como identificador da conta, nome, endereço de e-mail e foto de perfil, quando disponibilizados. Utilizamos essas informações para identificar sua conta, permitir o acesso e preencher os dados básicos do perfil.</p>
          <p style={paragraph}>Você pode optar por não utilizar o login com Google, mas nesse caso não poderá acessar as funcionalidades que exigem uma conta autenticada. O tratamento de dados recebidos do Google segue esta política e, quando aplicável, a Política de Dados do Usuário dos Serviços de API do Google e seus requisitos de uso limitado (Limited Use).</p>
        </section>

        <section style={section}>
          <h2 style={heading}>6. Notificações por e-mail, Gmail API e newsletters</h2>
          <p style={paragraph}>O Maratonei envia diferentes tipos de mensagens:</p>
          <ul style={list}>
            <li><strong>Boas-vindas:</strong> mensagem transacional enviada após a criação de uma conta.</li>
            <li><strong>Notificações sociais:</strong> avisos de novo seguidor e de comentários em episódios. Essas categorias começam ativadas nas configurações e podem ser desativadas individualmente pelo usuário.</li>
            <li><strong>Novidades do catálogo:</strong> avisos sobre novas séries, filmes e episódios. Essa categoria também começa ativada e pode ser desativada nas configurações.</li>
            <li><strong>Newsletters e comunicados gerais:</strong> mensagens editoriais enviadas aos endereços de e-mail confirmados das contas do Maratonei. É possível cancelar o recebimento pelo link de descadastramento presente nessas mensagens.</li>
          </ul>
          <p style={paragraph}>Para enviar mensagens, o Maratonei utiliza a Gmail API por meio de uma conta de envio administrada pelo próprio serviço. A permissão técnica utilizada é limitada ao envio de mensagens (gmail.send). A integração envia e-mails a partir da conta remetente do Maratonei; ela não acessa, lê, pesquisa, organiza ou armazena a caixa de entrada Gmail dos usuários e não acessa seus contatos.</p>
          <p style={paragraph}>O endereço de e-mail associado à sua conta é utilizado como destinatário das comunicações. Nas notificações sociais e de catálogo, o envio respeita as preferências salvas na conta. O cancelamento de newsletters impede novos comunicados gerais para aquele endereço, sem excluir a conta nem alterar as demais preferências de notificações.</p>
        </section>

        <section style={section}>
          <h2 style={heading}>7. Catálogo de filmes e séries e serviços externos</h2>
          <p style={paragraph}>O aplicativo consulta o The Movie Database (TMDB) para pesquisar e apresentar informações de catálogo, como títulos, sinopses, imagens, datas e dados de filmes e séries. Quando você pesquisa ou abre títulos, solicitações técnicas relacionadas à consulta podem ser transmitidas ao TMDB. O Maratonei não envia sua senha Google ou o conteúdo de sua caixa de entrada a esse serviço.</p>
        </section>

        <section style={section}>
          <h2 style={heading}>8. Armazenamento e compartilhamento com fornecedores</h2>
          <p style={paragraph}>Para operar o Maratonei, utilizamos fornecedores de infraestrutura e tecnologia. Os principais serviços envolvidos incluem Supabase, para banco de dados e autenticação; Vercel, para hospedagem e execução da aplicação; Google, para login e envio de e-mails; e TMDB, para consulta de informações do catálogo.</p>
          <p style={paragraph}>Esses fornecedores podem tratar dados na medida necessária para fornecer seus serviços, manter a infraestrutura, proteger os sistemas e cumprir suas próprias obrigações. O acesso é limitado às finalidades operacionais descritas nesta política. Também poderemos compartilhar informações quando necessário para cumprir obrigação legal, atender ordem válida de autoridade competente, proteger direitos ou investigar fraude e incidentes de segurança.</p>
        </section>

        <section style={section}>
          <h2 style={heading}>9. Cookies, sessão e armazenamento local</h2>
          <p style={paragraph}>O aplicativo utiliza mecanismos de sessão e armazenamento local para autenticação, manutenção do acesso, preferências e funcionamento de recursos. O navegador também pode armazenar cookies ou identificadores técnicos associados a esses serviços. Você pode gerenciar cookies nas configurações do navegador; bloquear mecanismos essenciais pode impedir o login ou prejudicar o funcionamento do aplicativo.</p>
        </section>

        <section style={section}>
          <h2 style={heading}>10. Retenção e exclusão de dados</h2>
          <p style={paragraph}>Mantemos os dados enquanto forem necessários para fornecer o serviço, manter sua conta e cumprir as finalidades desta política. Alguns registros poderão ser conservados pelo período exigido por lei, para exercício regular de direitos, prevenção de fraude ou resolução de incidentes. Quando os dados deixarem de ser necessários, serão excluídos ou anonimizados, observadas as hipóteses legais de conservação.</p>
          <p style={paragraph}>Para solicitar a exclusão da conta e dos dados pessoais associados, entre em contato pelo e-mail <a href="mailto:contatomaratoneiapp@gmail.com" style={{ color: '#FACC15' }}>contatomaratoneiapp@gmail.com</a>, usando o assunto “Exclusão de conta e dados — Maratonei”. A solicitação será analisada e poderá exigir confirmação razoável de identidade. A exclusão da conta não equivale ao simples cancelamento de newsletters.</p>
        </section>

        <section style={section}>
          <h2 style={heading}>11. Segurança</h2>
          <p style={paragraph}>Adotamos medidas técnicas e administrativas destinadas a proteger os dados contra acesso não autorizado, perda, alteração ou divulgação indevida. O acesso a dados operacionais é limitado conforme as funções necessárias para manter o serviço. Nenhum sistema conectado à internet é completamente livre de riscos; recomendamos proteger sua conta Google, utilizar dispositivos atualizados e não compartilhar suas credenciais.</p>
        </section>

        <section style={section}>
          <h2 style={heading}>12. Seus direitos e como exercê-los</h2>
          <p style={paragraph}>Nos termos da Lei Geral de Proteção de Dados Pessoais (LGPD) e de outras normas aplicáveis, você pode solicitar, conforme o caso, confirmação da existência de tratamento, acesso aos dados, correção de informações incompletas ou desatualizadas, informação sobre compartilhamento, anonimização, bloqueio ou eliminação de dados, portabilidade quando aplicável, oposição e revisão de decisões automatizadas nos termos da lei.</p>
          <p style={paragraph}>Para exercer seus direitos, escreva para <a href="mailto:contatomaratoneiapp@gmail.com" style={{ color: '#FACC15' }}>contatomaratoneiapp@gmail.com</a>, utilizando o assunto “Privacidade — Maratonei”. Poderemos solicitar informações razoáveis para confirmar sua identidade e proteger sua conta antes de atender ao pedido.</p>
        </section>

        <section style={section}>
          <h2 style={heading}>13. Crianças e adolescentes</h2>
          <p style={paragraph}>O Maratonei não é desenvolvido especificamente para crianças. Se um responsável acreditar que uma criança forneceu dados pessoais ao serviço de forma inadequada, poderá entrar em contato pelo endereço indicado nesta política para que a situação seja analisada.</p>
        </section>

        <section style={section}>
          <h2 style={heading}>14. Uso das APIs do Google e conteúdo proibido</h2>
          <p style={paragraph}>O Maratonei utiliza serviços e APIs do Google para autenticação e envio de e-mails, conforme descrito nesta política. O aplicativo não utiliza APIs do Google para criar, gerar, solicitar, armazenar ou distribuir imagens íntimas não consensuais (NCII), inclusive conteúdo desse tipo gerado por inteligência artificial. Os dados obtidos por meio das APIs do Google não são utilizados para desenvolver, treinar ou aprimorar modelos de inteligência artificial ou aprendizado de máquina.</p>
        </section>

        <section style={section}>
          <h2 style={heading}>15. Alterações nesta política</h2>
          <p style={paragraph}>Esta política poderá ser atualizada para refletir mudanças no aplicativo, nos fornecedores utilizados ou nas exigências legais. A versão vigente será publicada nesta página, acompanhada da data da última atualização.</p>
        </section>

        <footer style={{ borderTop: '1px solid #ffffff18', paddingTop: 20, color: '#8190AE', fontSize: 12, lineHeight: 1.7 }}>
          Maratonei App · <a href="https://maratoneiapp.com.br" style={{ color: '#FACC15', textDecoration: 'none' }}>maratoneiapp.com.br</a><br />
          Contato: <a href="mailto:contatomaratoneiapp@gmail.com" style={{ color: '#FACC15' }}>contatomaratoneiapp@gmail.com</a>
        </footer>
      </article>
    </main>
  )
}
