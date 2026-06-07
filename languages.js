// languages.js

let examData = [];
let infoData = [];

// Load JSON files
Promise.all([
  fetch("tekoan_eksam_output.json").then(res => res.json()),
  fetch("tekoan_info_output.json").then(res => res.json())
]).then(([examJson, infoJson]) => {
  examData = examJson;
  infoData = infoJson;
  renderDialects();
  renderExamLanguages();
});

// Render dialects from info JSON
function renderDialects() {
  const container = document.getElementById("dialects");
  const dialectPage = infoData.find(page => page.content.includes("Standard Tekoan Dialect"));
  container.innerHTML = dialectPage 
    ? `<p>${dialectPage.content}</p>` 
    : "<p>No dialect information available.</p>";
}

// Render exam language requirements from exam JSON
function renderExamLanguages() {
  const container = document.getElementById("examLanguages");
  const examPage = examData.find(page => page.content.includes("Exam levels expl"));
  container.innerHTML = examPage 
    ? `<p>${examPage.content}</p>` 
    : "<p>No exam language requirements available.</p>";
}
