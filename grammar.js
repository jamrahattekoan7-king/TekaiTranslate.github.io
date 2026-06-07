// grammar.js

let grammarData = [];

// Load Grammar JSON
fetch("tekoan_grammar_output.json")
  .then(res => res.json())
  .then(data => {
    grammarData = data;
    renderGrammar();
  });

// Render grammar sections
function renderGrammar() {
  renderSection("Noun Grammatical Cases", "nounCases");
  renderSection("Verbs and Conjugations", "verbConjugations");
  renderSection("Adjectives and Adverbs", "adjectives");
  renderSection("Syntax", "syntaxRules");
}

// Helper function to render a section
function renderSection(keyword, elementId) {
  const container = document.getElementById(elementId);
  const sectionPage = grammarData.find(page => page.content.includes(keyword));
  container.innerHTML = sectionPage 
    ? `<pre>${sectionPage.content}</pre>` 
    : "<p>No data available for this section.</p>";
}
