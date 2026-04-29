const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Missing #app mount element.');
}

const main = document.createElement('main');
const heading = document.createElement('h1');
const message = document.createElement('p');

heading.textContent = 'Akashic Research Engine';
message.innerHTML = 'GitHub Pages is configured for <strong>akashicresearch.info</strong>.';

main.append(heading, message);
app.append(main);
