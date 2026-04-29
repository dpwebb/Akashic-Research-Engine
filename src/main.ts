const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Missing #app mount element.');
}

const main = document.createElement('main');
const heading = document.createElement('h1');
const message = document.createElement('p');
const domain = document.createElement('strong');

heading.textContent = 'Akashic Research Engine';
domain.textContent = 'akashicresearch.info';
message.append('GitHub Pages is configured for ', domain, '.');

main.append(heading, message);
app.append(main);
