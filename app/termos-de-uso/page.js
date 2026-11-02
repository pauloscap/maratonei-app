export const metadata = {
  title: 'Termos de Uso | Maratonei App',
  description: 'Conheça as condições de acesso e utilização do Maratonei App.',
  alternates: { canonical: 'https://maratoneiapp.com.br/termos-de-uso' },
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

export default function TermosDeUso() {
  return (
    <main style={{ minHeight: '100vh', background: '#080E1F', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif', padding: '32px 18px 56px' }}>
      <article style={{ maxWidth: 820, margin: '0 auto' }}>
        <a href="/login" style={{ color: '#FACC15', textDecoration: 'none', fontSize: 13, fontWeight: 800 }}>← Voltar ao Maratonei</a>
        <header style={{ padding: '34px 0 26px', borderBottom: '1px solid #ffffff18', marginBottom: 28 }}>
          <div style={{ color: '#FACC15', fontSize: 11, fontWeight: 900, letterSpacing: 2, marginBottom: 10 }}>MARATONEI APP</div>
          <h1 style={{ fontSize: 'clamp(28px, 6vw, 42px)', lineHeight: 1.12, letterSpacing: -1.2, margin: '0 0 12px', fontWeight: 900 }}>Termos de Uso</h1>
          <p style={{ ...paragraph, margin: 0 }}>Última atualização: 1º de novembro de 2026</p>
        </header>

        <section style={section}>
          <h2 style={heading}>1. Sobre estes termos</h2>
          <p style={paragraph}>Estes Termos de Uso regulam o acesso e a utilização do Maratonei App, serviço digital destinado à organização de filmes e séries, criação de listas, acompanhamento de episódios e progresso de visualização e interação entre usuários.</p>
          <p style={paragraph}>Ao acessar ou utilizar o Maratonei, você declara que leu e compreendeu estes termos. Caso não concorde com eles, não utilize o serviço.</p>
        </section>

        <section style={section}>
          <h2 style={heading}>2. Conta e acesso</h2>
          <p style={paragraph}>Algumas funcionalidades dependem da criação de uma conta e da autenticação por meio do Google. Você é responsável por manter a segurança dos meios de acesso à sua conta e por informar dados corretos e atualizados. As atividades realizadas em sua conta serão consideradas de sua responsabilidade, salvo quando houver uso indevido comprovado que não lhe possa ser atribuído.</p>
          <p style={paragraph}>Você deve utilizar apenas uma conta que esteja autorizado a acessar e comunicar ao Maratonei qualquer suspeita de acesso não autorizado.</p>
        </section>

        <section style={section}>
          <h2 style={heading}>3. Uso permitido e condutas proibidas</h2>
          <p style={paragraph}>Você concorda em utilizar o serviço de forma lícita, respeitosa e compatível com sua finalidade. Não é permitido:</p>
          <ul style={list}>
            <li>violar leis, direitos de terceiros ou estes termos;</li>
            <li>publicar conteúdo ilegal, ameaçador, discriminatório, abusivo, enganoso ou que viole direitos autorais, de imagem ou de privacidade;</li>
            <li>tentar acessar contas, sistemas, dados ou áreas sem autorização;</li>
            <li>interferir no funcionamento, segurança ou disponibilidade do aplicativo;</li>
            <li>utilizar robôs, automações ou outros meios para abusar do serviço, coletar dados indevidamente ou prejudicar outros usuários;</li>
            <li>utilizar o Maratonei para spam, fraude ou qualquer atividade ilícita.</li>
          </ul>
        </section>

        <section style={section}>
          <h2 style={heading}>4. Conteúdo e interações dos usuários</h2>
          <p style={paragraph}>Você mantém a responsabilidade pelo conteúdo que inserir ou compartilhar no Maratonei, incluindo comentários, avaliações, informações de perfil e demais contribuições. Ao publicar conteúdo, você declara ter os direitos e autorizações necessários e concede ao Maratonei autorização não exclusiva, gratuita e limitada ao funcionamento do serviço para hospedar, armazenar, exibir e distribuir esse conteúdo dentro das funcionalidades do aplicativo.</p>
          <p style={paragraph}>O Maratonei poderá remover conteúdo ou restringir funcionalidades quando houver indícios de violação destes termos, da legislação ou de direitos de terceiros, buscando agir de forma proporcional.</p>
        </section>

        <section style={section}>
          <h2 style={heading}>5. Catálogo, informações e serviços de terceiros</h2>
          <p style={paragraph}>O Maratonei oferece ferramentas de organização e acompanhamento. Informações sobre filmes, séries, temporadas, episódios, imagens, disponibilidade e plataformas podem ter origem em fontes externas e podem conter erros, atrasos ou alterações.</p>
          <p style={paragraph}>O Maratonei não é, por si só, um serviço de streaming e não garante a disponibilidade de títulos em plataformas de terceiros. Links, nomes e marcas de serviços externos são apresentados para referência e conveniência. O acesso a esses serviços está sujeito aos termos, políticas, preços e condições dos respectivos fornecedores.</p>
        </section>

        <section style={section}>
          <h2 style={heading}>6. Disponibilidade e alterações do serviço</h2>
          <p style={paragraph}>Buscamos manter o Maratonei disponível e funcional, mas não garantimos operação ininterrupta, livre de falhas ou compatibilidade com todos os dispositivos e navegadores. Poderemos corrigir, atualizar, suspender ou descontinuar funcionalidades, total ou parcialmente, quando necessário para manutenção, segurança, evolução do produto ou outros motivos legítimos.</p>
        </section>

        <section style={section}>
          <h2 style={heading}>7. Propriedade intelectual</h2>
          <p style={paragraph}>A estrutura, identidade visual, elementos de interface, textos e componentes próprios do Maratonei são protegidos pela legislação aplicável e pertencem ao titular do serviço ou são utilizados mediante autorização. Estes termos não transferem a você qualquer titularidade sobre esses elementos.</p>
          <p style={paragraph}>Marcas, títulos, imagens e materiais de terceiros permanecem pertencentes aos respectivos titulares. Seu uso no aplicativo não representa endosso, parceria ou vínculo comercial, salvo indicação expressa.</p>
        </section>

        <section style={section}>
          <h2 style={heading}>8. Privacidade e dados pessoais</h2>
          <p style={paragraph}>O tratamento de dados pessoais relacionado ao uso do Maratonei é explicado em nossa <a href="/politica-de-privacidade" style={{ color: '#FACC15' }}>Política de Privacidade</a>, que integra estes termos para fins de compreensão das práticas de privacidade. Recomendamos a leitura desse documento.</p>
        </section>

        <section style={section}>
          <h2 style={heading}>9. Suspensão e encerramento</h2>
          <p style={paragraph}>Poderemos limitar, suspender ou encerrar o acesso a funcionalidades ou à conta quando houver violação destes termos, risco à segurança, obrigação legal ou uso que possa prejudicar o serviço ou terceiros. Sempre que razoavelmente possível, a medida será proporcional à situação. Você pode deixar de utilizar o serviço a qualquer momento e solicitar orientações sobre seus dados pelo contato indicado abaixo.</p>
        </section>

        <section style={section}>
          <h2 style={heading}>10. Limitação de responsabilidade</h2>
          <p style={paragraph}>Na medida permitida pela legislação aplicável, o Maratonei não se responsabiliza por indisponibilidades de serviços de terceiros, alterações em catálogos ou plataformas externas, falhas de conexão ou dispositivo do usuário, nem por decisões tomadas com base em informações externas exibidas no aplicativo. Nada nestes termos exclui ou limita responsabilidades que não possam ser afastadas por lei, nem prejudica os direitos assegurados ao consumidor quando aplicáveis.</p>
        </section>

        <section style={section}>
          <h2 style={heading}>11. Alterações destes termos</h2>
          <p style={paragraph}>Estes termos poderão ser atualizados para refletir mudanças no aplicativo, nos serviços oferecidos ou na legislação. A versão vigente será publicada nesta página, com a respectiva data de atualização. O uso continuado após a publicação de alterações representa ciência da nova versão, sem prejuízo de eventual consentimento específico exigido por lei.</p>
        </section>

        <section style={section}>
          <h2 style={heading}>12. Legislação e contato</h2>
          <p style={paragraph}>Estes termos são interpretados de acordo com as leis da República Federativa do Brasil, respeitadas as normas obrigatórias de proteção ao consumidor e demais regras aplicáveis.</p>
          <p style={paragraph}>Em caso de dúvidas ou solicitações, entre em contato pelo e-mail <a href="mailto:contatomaratoneiapp@gmail.com" style={{ color: '#FACC15' }}>contatomaratoneiapp@gmail.com</a>.</p>
        </section>

        <footer style={{ borderTop: '1px solid #ffffff18', paddingTop: 20, color: '#8190AE', fontSize: 12, lineHeight: 1.7 }}>
          Maratonei App · <a href="https://maratoneiapp.com.br" style={{ color: '#FACC15', textDecoration: 'none' }}>maratoneiapp.com.br</a><br />
          <a href="/politica-de-privacidade" style={{ color: '#FACC15' }}>Política de Privacidade</a> · Contato: <a href="mailto:contatomaratoneiapp@gmail.com" style={{ color: '#FACC15' }}>contatomaratoneiapp@gmail.com</a>
        </footer>
      </article>
    </main>
  )
}
