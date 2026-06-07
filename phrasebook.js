// phrasebook.js

let phrasebookData = [];

// Load Phrasebook JSON
fetch("tekoan_phrasebook_output.json")
  .then(res => res.json())
  .then(data => {
    phrasebookData = data;
    renderPhrasebook();
  });

// Render phrasebook sections
function renderPhrasebook() {
  renderSection("Basic Phrases", "basicPhrases");
  renderSection("Introducing yourself", "introductions");
  renderSection("Talking with a friend", "friendTalk");
  renderSection("Talking with a coworker", "coworkerTalk");
}

// Helper function to render a section
function renderSection(keyword, elementId) {
  const container = document.getElementById(elementId);
  const sectionPage = phrasebookData.find(page => page.content.includes(keyword));
  container.innerHTML = sectionPage 
    ? `<pre>${sectionPage.content}</pre>` 
    : "<p>No data available for this section.</p>";
}
