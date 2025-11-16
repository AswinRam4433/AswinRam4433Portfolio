const input = document.getElementById('input');
const output = document.getElementById('output');
const terminal = document.getElementById('terminal');

const commands = {
    help: `
Available commands:
  <span class="command">contact</span>   - Display my contact information
  <span class="command">clear</span>     - Clear the terminal
    `,
    contact: `
You can reach me at:
- <a href="www.linkedin.com/in/aswinramanathan" target="_blank">LinkedIn</a>
- <a href="https://github.com/AswinRam4433" target="_blank">GitHub</a>
    `,
};

function executeCommand(command) {
    output.innerHTML += `<div class="input-line"><span class="prompt"></span><span class="command">${command}</span></div>`;
    if (command === 'clear') {
        output.innerHTML = '';
    } else if (commands[command]) {
        output.innerHTML += `<div class="response">${commands[command]}</div>`;
    } else {
        output.innerHTML += `<div class="response">Command not found: ${command}. Type 'help' for a list of commands.</div>`;
    }
    terminal.scrollTop = terminal.scrollHeight;
}

input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const command = input.value.trim().toLowerCase();
        if (command) {
            executeCommand(command);
        }
        input.value = '';
    }
});

window.onload = () => {
    executeCommand('help');
};

const themeToggle = document.getElementById('checkbox');
themeToggle.addEventListener('change', () => {
    document.body.classList.toggle('light-mode');
});