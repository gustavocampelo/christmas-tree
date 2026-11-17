# Verificação realizada

Em 13/11/2026, no ambiente Windows disponível:

- Dependências instaladas; `package-lock.json` incluído.
- `npm run typecheck`: passou.
- `npm test`: 4 testes passaram (geometria, relógio, neve, URL/movimento reduzido).
- `npm run build`: passou; saída estática em `dist/`.
- Aplicação iniciada com Vite e aberta no navegador integrado.
- Inspeção visual em 1280×720, 390×844 e 320×568, sem rolagem horizontal e com estrela e presentes visíveis.
- Quadros em 3 s, 8 s e 14 s capturados e examinados. Ajustados contraste, tamanho dos glifos, frente clara e espaçamento dos controles móveis.
- Testados pausa/retomada, reinício, neve, três qualidades, rotação e diagnóstico, por botões e atalhos. A tecla N dentro do seletor não alterou a neve.
- Redimensionamento e troca de qualidade preservaram o relógio e a geometria.
- Exportação PNG pelo diagnóstico funcionou. Duas exportações independentes de `?t=14&paused=1` na mesma janela tiveram SHA-256 idêntico: `5FD7F3B85C66246BA1559F0FBE385FF595C17974BE09FF52A46BABA4A35C0FDC`.
- Nenhum erro ou aviso de console observado ao final.
- Modo médio observado em torno de 34 FPS durante execução contínua; medições pontuais variaram com a carga e o aquecimento do navegador. Não representa garantia para outros equipamentos.

Capturas locais (pasta `.qa`, ignorada pelo Git): `desktop-3s.jpg`, `desktop-8s.jpg`, `desktop-14s.jpg` e `mobile-14s.jpg`.

O ambiente expunha Node.js, mas não `npm` no PATH. Para a validação foi usado o CLI oficial do npm 11.6.2 baixado do registro npm em `.tools/` (ignorado pelo Git), sem mudar configurações globais. O projeto usa os scripts npm convencionais descritos no README. A execução padrão em um terminal requer Node.js e npm instalados.

A preferência de movimento reduzido e o retorno após intervalos longos foram cobertos por testes do controlador. O navegador disponível não oferecia emulação de `prefers-reduced-motion`; essa preferência não foi alterada no sistema do usuário.
