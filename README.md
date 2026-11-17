# Noite de Natal · ASCII

[![Animação da árvore de Natal ASCII: montagem, decoração, neve e rotação](docs/demo.gif)](https://gustavocampelo.github.io/christmas-tree/)

**[Abrir a demonstração ao vivo](https://gustavocampelo.github.io/christmas-tree/)**

Árvore de Natal 3D procedural em uma SPA React, Vite, TypeScript e Tailwind CSS. Toda a cena é desenhada com caracteres ASCII imprimíveis em um único Canvas 2D. Não usa modelos, imagens, vídeo de fundo, fontes externas, backend ou banco de dados.

## Executar

Instale **Node.js 22.12 ou superior**, com npm. Na pasta deste projeto:

```sh
npm install
npm run dev
```

O Vite informa o endereço de desenvolvimento no terminal, normalmente **http://localhost:5173** (a configuração local usa o equivalente `http://127.0.0.1:5173`). Se a porta estiver ocupada, o Vite seleciona a próxima disponível.

```sh
npm run typecheck
npm test
npm run build
npm run preview
```

O teste usa o suporte nativo a TypeScript do Node 22.18+ ou 24+. O build gera `dist/`, que pode ser servido por qualquer hospedagem estática. O caminho base relativo permite publicar em uma subpasta. Não há serviços externos necessários em tempo de execução.

## Controles

| Tecla | Ação |
| --- | --- |
| Espaço | Pausar ou retomar tudo: montagem, rotação, neve e brilho |
| R | Reiniciar e reproduzir a montagem desde zero |
| ← / → | Diminuir / aumentar rotação (de 0 a 3×) |
| N | Ativar / desativar a neve que cai |
| D | Abrir / fechar diagnóstico |

Os mesmos controles estão disponíveis por toque. O seletor oferece qualidade baixa, média (padrão) e alta. Atalhos globais são ignorados em seletores, campos, botões e links, preservando o comportamento nativo de teclado. Use Tab para navegar; o foco é visível. O diagnóstico mostra FPS, tempo, pontos gerados/amostrados, células, rotação, velocidade, qualidade e tempo de renderização. O botão **Salvar PNG**, nesse painel, exporta apenas o Canvas na resolução física atual.

Com `prefers-reduced-motion: reduce`, a árvore começa completa e pausada em 14 s. **Retomar** inicia explicitamente a animação; **Reiniciar** reproduz a montagem. Nenhuma preferência é enviada ou armazenada externamente.

## Quadros determinísticos

Abra diretamente, sem esperar a animação:

```text
/?t=3&paused=1&debug=1
/?t=8&paused=1
/?t=14&paused=1
/?t=14&paused=1&quality=high&snow=0
```

| Parâmetro | Valores |
| --- | --- |
| `t` | Tempo inicial em segundos, entre 0 e 86400 |
| `paused` | `1` para pausar, `0` para reproduzir |
| `debug` | `1` abre diagnóstico |
| `quality` | `low`, `medium` ou `high` |
| `snow` | `0` desliga a neve em movimento |

Uma mesma semente, tempo, velocidade inicial, qualidade, fonte local e dimensões de tela produzem o mesmo quadro, inclusive neve e cintilação. As trajetórias dos flocos são funções do tempo absoluto; não dependem de quadros anteriores. Alterar a velocidade durante a execução preserva a continuidade do ângulo. Reiniciar mantém a qualidade, neve e velocidade escolhidas, mas zera tempo e ângulo. Os parâmetros são lidos na abertura; os controles não reescrevem a URL.

## Aparência e arquitetura

- `src/engine/config.ts`: semente 7, 24 camadas, densidade, paleta, câmera, iluminação, fonte, limite de DPR, neve, timeline e qualidades.
- `src/engine/geometry.ts`: galhos desencontrados e caídos, tronco, neve acumulada, bolas com normais esféricas, festão com 2600 amostras e 3,6 voltas, 170 luzes, estrela e caixas com fitas e laços. A geometria é gerada uma vez e compartilhada nas remontagens de StrictMode.
- `src/engine/renderer.ts`: transformação de posições e normais, câmera elevada, projeção em perspectiva, células medidas pela fonte, recorte, profundidade por célula, iluminação e atlas de glifos com 32 intensidades por cor. O chão e os flocos permanecem no espaço global. A estrela é facetada e voltada para a câmera, preservando as cinco pontas durante a rotação.
- `src/engine/animation.ts`: relógio, parâmetros de URL e trajetórias determinísticas da neve, com semente independente.
- `src/components/AsciiChristmasTree.tsx`: ciclo de vida do Canvas, ResizeObserver, requestAnimationFrame único, limpeza e diagnóstico limitado a 2,5 atualizações por segundo.
- `src/components/SceneControls.tsx` e `src/App.tsx`: interface e atalhos. React não recebe atualizações por quadro.

Para alterar o enquadramento, ajuste `camera.verticalSpan`, `horizontalSpan`, `targetY` e `elevation`. Diminuir os spans aproxima a cena; considere as pontas da estrela e as caixas. `qualities` controla fonte, altura de linha, amostragem da folhagem e quantidade de flocos. A dimensão real da fonte determina a proporção horizontal, evitando achatamento. O DPR é limitado a 2. O atlas é reconstruído apenas quando tamanho/qualidade/DPR mudam, e os buffers numéricos são reutilizados.

A timeline revela pontos nas suas posições definitivas: folhagem entre 0,4–7 s, bolas e festão a partir de 5 s, luzes a partir de 7 s, presentes a partir de 8,55 s e estrela a partir de 9,1 s. Tudo está completo aos 10 s. Há uma breve frente clara nos ramos recém-revelados. Depois a rotação continua a 18°/s por padrão. A volta de uma aba em segundo plano reinicia a referência de tempo sem avançar a montagem; deltas excepcionais são limitados a 50 ms.

## Referência e limites

Referência: [ASCII Christmas Tree, de 999.2006.01.19 no Instagram](https://www.instagram.com/reels/DfmBvgUNizn/).

O vídeo foi acessado e observado no navegador durante o início da construção, a decoração e a árvore completa em rotação. A reprodução aproxima proporções, textura fina, verde frio, bolas vermelhas/douradas, espiral, neve e frente de montagem. **Não é o código original nem uma reprodução pixel a pixel.** A distribuição procedural usa Mulberry32, não o gerador do NumPy. A timeline foi ajustada a partir da especificação e da observação, sem extração quadro a quadro. A estrela de cinco pontas fica voltada para a câmera e usa um halo discreto, em lugar dos raios longos da referência. O chão tem contraste reduzido e o editor de código da gravação foi substituído por controles compactos.

O desempenho depende do navegador, fonte, tamanho da janela e hardware. Média equilibra detalhe e custo; Baixa reduz a grade e a amostragem; Alta aumenta o detalhe e pode ficar abaixo de 30 FPS em equipamentos mais lentos. A mudança de qualidade não recria a geometria nem reinicia o relógio.
