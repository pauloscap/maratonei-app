export const metadata = {
  title: 'Política de Privacidade | Maratonei App',
  description: 'Saiba como o Maratonei App coleta, utiliza, armazena e protege seus dados pessoais.',
  alternates: { canonical: 'https://maratoneiapp.com.br/politica-de-privacidade' },
}

const section = {
  marginBottom: 28,
}

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
          <p style={{ ...paragraph, margin: 0 }}>Última atualização: 1º de novembro de 2026</p>
        </header>

        <section style={section}>
          <h2 style={heading}>1. Quem somos e a quem esta política se aplica</h2>
          <p style={paragraph}>O Maratonei App é um serviço digital para organizar filmes e séries, acompanhar o progresso de episódios, manter listas pessoais e interagir com outros usuários. Esta política explica como tratamos dados pessoais quando você acessa ou utiliza o aplicativo em maratoneiapp.com.br.</p>
          <p style={paragraph}>Para dúvidas ou solicitações relacionadas à privacidade, entre em contato pelo e-mail <a href="mailto:contatomaratoneiapp@gmail.com" style={{ color: '#FACC15' }}>contatomaratoneiapp@gmail.com</a>.</p>
        </section>

        <section style={section}>
          <h2 style={heading}>2. Dados que podemos coletar</h2>
          <p style={paragraph}>De acordo com os recursos que você utiliza, podemos tratar as seguintes informações:</p>
          <ul style={list}>
            <li><strong>Dados de conta e perfil:</strong> nome, endereço de e-mail, foto de perfil e identificador da conta fornecidos pelo Google quando você escolhe entrar com essa opção.</li>
            <li><strong>Dados de uso do Maratonei:</strong> listas de filmes e séries, episódios marcados, progresso, favoritos, avaliações, comentários, informações de perfil e interações sociais, como seguir outros usuários.</li>
            <li><strong>Preferências:</strong> configurações da conta e escolhas sobre o recebimento de notificações por e-mail.</li>
            <li><strong>Dados técnicos:</strong> informações necessárias para funcionamento, segurança e diagnóstico do serviço, como registros de acesso, tipo de navegador e dados técnicos enviados pelo dispositivo.</li>
            <li><strong>Armazenamento local:</strong> algumas preferências e informações de funcionamento podem ser mantidas no armazenamento local do navegador ou dispositivo.</li>
          </ul>
        </section>

        <section style={section}>
          <h2 style={heading}>3. Como usamos os dados</h2>
          <p style={paragraph}>Utilizamos os dados para criar e manter sua conta, permitir o acesso ao aplicativo, sincronizar suas listas e seu progresso, exibir seu perfil, viabilizar recursos sociais, salvar suas preferências, enviar avisos que você tenha escolhido receber, proteger o serviço e corrigir falhas.</p>
          <p style={paragraph}>Também podemos utilizar informações técnicas de forma agregada para compreender o funcionamento e melhorar a experiência do Maratonei. Não vendemos dados pessoais.</p>
        </section>

        <section style={section}>
          <h2 style={heading}>4. Login com Google e dados do Google</h2>
          <p style={paragraph}>Se você optar por entrar com o Google, receberemos as informações básicas autorizadas na tela de login, como nome, endereço de e-mail, foto de perfil e identificador da conta. Esses dados são utilizados para autenticar você e associar suas atividades à sua conta no Maratonei.</p>
          <p style={paragraph}>O uso dessas informações segue esta política e a Política de Dados do Usuário dos Serviços de API do Google, incluindo os requisitos de uso limitado (Limited Use), quando aplicáveis.</p>
        </section>

        <section style={section}>
          <h2 style={heading}>5. Envio de notificações por e-mail e Gmail API</h2>
          <p style={paragraph}>O Maratonei poderá enviar mensagens transacionais relacionadas à atividade no aplicativo, como avisos de novo seguidor ou comentário, quando esse recurso estiver disponível e você tiver ativado a respectiva preferência. As opções de notificação começam desativadas e podem ser alteradas nas configurações da conta.</p>
          <p style={paragraph}>Para enviar essas mensagens, o Maratonei utiliza a API Gmail por meio de uma conta de envio administrada pelo próprio serviço. A permissão técnica utilizada é limitada ao envio de e-mails (gmail.send). Essa integração serve para transmitir notificações do Maratonei e não é utilizada para ler, pesquisar, organizar ou armazenar mensagens da caixa de entrada Gmail dos usuários do aplicativo.</p>
          <p style={paragraph}>O endereço de e-mail associado à sua conta pode ser utilizado como destinatário das notificações que você habilitar. O conteúdo enviado limita-se ao aviso da atividade correspondente e a um link para acessar o Maratonei.</p>
        </section>

        <section style={section}>
          <h2 style={heading}>6. Onde os dados são armazenados e com quem podem ser compartilhados</h2>
          <p style={paragraph}>Os dados da conta e do aplicativo podem ser armazenados em serviços de infraestrutura e banco de dados utilizados para operar o Maratonei, incluindo Supabase e Vercel. O Google participa dos fluxos de autenticação e do serviço de envio de e-mails descritos nesta política.</p>
          <p style={paragraph}>Esses fornecedores tratam informações na medida necessária para prestar seus serviços, manter a segurança e operar a infraestrutura. Não autorizamos o uso dos dados pessoais dos usuários para finalidades próprias de publicidade pelo simples fato de utilizar esses serviços.</p>
          <p style={paragraph}>Também poderemos divulgar informações quando isso for necessário para cumprir obrigação legal, atender ordem válida de autoridade competente, proteger direitos ou prevenir fraude e incidentes de segurança.</p>
        </section>

        <section style={section}>
          <h2 style={heading}>7. Cookies, sessão e armazenamento local</h2>
          <p style={paragraph}>O aplicativo pode utilizar cookies, armazenamento local e mecanismos semelhantes para manter sua sessão, lembrar preferências, permitir autenticação e oferecer funcionalidades essenciais. Você pode gerenciar cookies nas configurações do navegador, mas o bloqueio de determinados recursos pode prejudicar o funcionamento do serviço.</p>
        </section>

        <section style={section}>
          <h2 style={heading}>8. Por quanto tempo mantemos os dados</h2>
          <p style={paragraph}>Mantemos os dados pelo período necessário para fornecer o serviço, cumprir as finalidades descritas nesta política, atender obrigações legais e resolver disputas. Quando não forem mais necessários, os dados poderão ser excluídos ou anonimizados, observadas as hipóteses legais de conservação.</p>
        </section>

        <section style={section}>
          <h2 style={heading}>9. Segurança</h2>
          <p style={paragraph}>Adotamos medidas técnicas e administrativas razoáveis para proteger os dados contra acesso não autorizado, perda, alteração ou divulgação indevida. Nenhum serviço conectado à internet é completamente livre de riscos; por isso, recomendamos que você proteja sua conta Google e seus dispositivos.</p>
        </section>

        <section style={section}>
          <h2 style={heading}>10. Seus direitos e como fazer uma solicitação</h2>
          <p style={paragraph}>Nos termos da legislação aplicável, incluindo a Lei Geral de Proteção de Dados Pessoais (LGPD), você pode solicitar confirmação do tratamento, acesso, correção, informações sobre compartilhamento, oposição ou eliminação de dados, quando cabível, além de outros direitos previstos em lei.</p>
          <p style={paragraph}>Para exercer seus direitos ou solicitar informações, escreva para <a href="mailto:contatomaratoneiapp@gmail.com" style={{ color: '#FACC15' }}>contatomaratoneiapp@gmail.com</a>, utilizando o assunto “Privacidade — Maratonei”. Poderemos solicitar informações razoáveis para confirmar sua identidade antes de atender ao pedido.</p>
        </section>

        <section style={section}>
          <h2 style={heading}>11. Privacidade de crianças e adolescentes</h2>
          <p style={paragraph}>O Maratonei não é direcionado especificamente a crianças. Caso um responsável entenda que uma criança forneceu dados pessoais ao serviço de forma inadequada, poderá entrar em contato pelo endereço indicado nesta política para que a situação seja avaliada.</p>
        </section>

        <section style={section}>
          <h2 style={heading}>12. Alterações nesta política</h2>
          <p style={paragraph}>Esta política poderá ser atualizada para refletir mudanças no aplicativo, nos serviços utilizados ou nas exigências legais. A versão vigente será publicada nesta página, com a respectiva data de atualização.</p>
        </section>

        <footer style={{ borderTop: '1px solid #ffffff18', paddingTop: 20, color: '#8190AE', fontSize: 12, lineHeight: 1.7 }}>
          Maratonei App · <a href="https://maratoneiapp.com.br" style={{ color: '#FACC15', textDecoration: 'none' }}>maratoneiapp.com.br</a><br />
          Contato: <a href="mailto:contatomaratoneiapp@gmail.com" style={{ color: '#FACC15' }}>contatomaratoneiapp@gmail.com</a>
        </footer>
      </article>
    </main>
  )
}
