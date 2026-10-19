import MugLogo from "./MugLogo.jsx"
import "./About.css"

function About() {
  return (
    <section className="card card--narrow about">
      <MugLogo size={64} />
      <h1>About Cozy Desk</h1>
      <p className="muted">Find your dream job before your coffee gets cold.</p>
      <p>Cozy Desk is a small job board for people who want to work for companies building a greener future. No noise, no endless scrolling: just clear offers and a quick way to apply.</p>
      <ul>
        <li><strong>Candidates</strong> browse offers and apply in a few clicks.</li>
        <li><strong>Employers</strong> post and edit their company's offers and read the applications.</li>
        <li><strong>Admins</strong> keep the whole board tidy from one page.</li>
      </ul>
      <p className="muted">Made with ☕ by Chase and Pierre, Epitech Pré-MSc, October 2026.</p>
    </section>
  )
}

export default About