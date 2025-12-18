// ============================
// Configuración (placeholder DB)
// ============================
// Aquí puedes poner las credenciales reales de tu backend / base de datos.
// Ejemplo: una API REST, Firebase, Supabase, MongoDB, etc.
const dbConfig = {
  apiKey: "AIzaSyCbm7LYeDnXJTk9bJJs9FyOvkmqxMs7f8U",
  authDomain: "serie-educativa.firebaseapp.com",
  databaseURL: "https://serie-educativa-default-rtdb.firebaseio.com",
  projectId: "serie-educativa",
  storageBucket: "serie-educativa.firebasestorage.app",
  messagingSenderId: "419592658892",
  appId: "1:419592658892:web:11a70ffa88f853a4920769",
  measurementId: "G-81N5THENWD"
};

// Interfaz esperada para el backend (esqueleto):
// async function saveComment(comment) { ... }
// async function registerLike(dateKey) { ... }
// async function fetchComments() { ... }
// async function fetchLikeStats() { ... }

// En este archivo solo simulamos el comportamiento en memoria / localStorage.

// ============================
// Utilidades
// ============================
function $(selector) {
  return document.querySelector(selector);
}

function createEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
}

// ============================
// Buscador de contenido
// ============================
const searchInput = $("#search-input");
const filterChips = document.querySelectorAll("[data-filter]");
const searchableCards = document.querySelectorAll("[data-searchable='true']");

let currentFilter = "all";

function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function applySearch() {
  const term = normalizeText(searchInput.value || "");

  searchableCards.forEach((card) => {
    const title = normalizeText(card.getAttribute("data-title") || "");
    const category = card.getAttribute("data-category") || "";
    const level = card.getAttribute("data-level") || "";

    const matchText = title.includes(term);
    const matchFilter =
      currentFilter === "all" ||
      category === currentFilter ||
      level === currentFilter;

    card.style.display = matchText && matchFilter ? "" : "none";
  });
}

if (searchInput) {
  searchInput.addEventListener("input", applySearch);
}

filterChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    filterChips.forEach((c) => c.setAttribute("data-active", "false"));
    chip.setAttribute("data-active", "true");
    currentFilter = chip.getAttribute("data-filter") || "all";
    applySearch();
  });
});

// Atajo de teclado Ctrl+K / Cmd+K para enfocar el buscador
window.addEventListener("keydown", (e) => {
  const isMac = navigator.platform.toLowerCase().includes("mac");
  const combo = isMac ? e.metaKey && e.key === "k" : e.ctrlKey && e.key === "k";
  if (combo) {
    e.preventDefault();
    searchInput?.focus();
  }
});

// ============================
// Terminal simulada
// ============================
const terminalOutput = $("#terminal-output");
const terminalInput = $("#terminal-input");

const terminalState = {
  history: [],
  historyIndex: -1,
};

function printLine(text, type = "output") {
  if (!terminalOutput) return;
  const line = createEl("div", `terminal-line ${type}`, text);
  terminalOutput.appendChild(line);
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function getTodayKey() {
  const today = new Date();
  return today.toISOString().slice(0, 10); // YYYY-MM-DD
}

function simulateInstall(name) {
  printLine(`Instalando ${name}...`, "output");
  setTimeout(() => {
    printLine(`✔ ${name} instalado correctamente (simulado).`, "output");
  }, 400);
}

function handleCommand(rawCommand) {
  const input = rawCommand.trim();
  if (!input) return;

  printLine(`$ ${input}`, "command");

  terminalState.history.push(input);
  terminalState.historyIndex = terminalState.history.length;

  const [command, ...args] = input.split(" ");
  const argStr = args.join(" ");

  switch (command) {
    case "help":
      printLine(
        [
          "Comandos disponibles:",
          "  help                  - Muestra esta ayuda",
          "  clear                 - Limpia la terminal",
          "  ls                    - Lista rutas de esta web",
          "  start <nivel>         - Sugerencias de ruta (nivel: basico, intermedio, avanzado)",
          "  install <tool>        - Simula la instalación de una herramienta",
          "  use <libreria>        - Simula el uso de una librería",
          "  info os               - Lista sistemas operativos",
          "  info editor           - Lista editores/IDE",
        ].join("\n"),
        "output"
      );
      break;
    case "clear":
      if (terminalOutput) {
        terminalOutput.innerHTML = "";
      }
      break;
    case "ls":
      printLine(
        [
          "./lenguajes/python/",
          "./lenguajes/javascript/",
          "./lenguajes/csharp/",
          "./lenguajes/java/",
          "./editores/vscode/",
          "./editores/vim/",
          "./editores/sublime/",
          "./sistemas/windows/",
          "./sistemas/linux/",
          "./sistemas/android/",
          "./sistemas/ios/",
          "./sistemas/macos/",
        ].join("\n"),
        "output"
      );
      break;
    case "start":
      if (!argStr) {
        printLine(
          "Usa: start basico | intermedio | avanzado",
          "error"
        );
      } else if (argStr === "basico") {
        printLine(
          "Ruta sugerida (básico): Python → VSCode → Windows o Linux.",
          "output"
        );
      } else if (argStr === "intermedio") {
        printLine(
          "Ruta sugerida (intermedio): JavaScript → Git → Linux / macOS.",
          "output"
        );
      } else if (argStr === "avanzado") {
        printLine(
          "Ruta sugerida (avanzado): C# / Java → Linux servers → CI/CD.",
          "output"
        );
      } else {
        printLine("Nivel no reconocido. Usa basico, intermedio o avanzado.", "error");
      }
      break;
    case "install":
      if (!argStr) {
        printLine("Especifica qué herramienta quieres instalar.", "error");
      } else {
        simulateInstall(argStr);
      }
      break;
    case "use":
      if (!argStr) {
        printLine("Especifica el nombre de la librería.", "error");
      } else {
        printLine(
          `Cargando librería '${argStr}'... (esto es una simulación, no se ejecuta código real).`,
          "output"
        );
      }
      break;
    case "info":
      if (argStr === "os") {
        printLine(
          [
            "Sistemas operativos disponibles:",
            "  - Windows",
            "  - Linux",
            "  - macOS",
            "  - Android",
            "  - iOS",
          ].join("\n"),
          "output"
        );
      } else if (argStr === "editor") {
        printLine(
          [
            "Editores / IDE destacados:",
            "  - VSCode",
            "  - Vim",
            "  - Sublime Text",
            "  - Android Studio",
          ].join("\n"),
          "output"
        );
      } else {
        printLine("Usa: info os | info editor", "error");
      }
      break;
    default:
      printLine(
        `Comando no reconocido: ${command}. Escribe 'help' para ver opciones.`,
        "error"
      );
      break;
  }
}

if (terminalInput) {
  terminalInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      handleCommand(terminalInput.value);
      terminalInput.value = "";
    } else if (e.key === "ArrowUp") {
      if (terminalState.historyIndex > 0) {
        terminalState.historyIndex -= 1;
        terminalInput.value = terminalState.history[terminalState.historyIndex];
      }
      e.preventDefault();
    } else if (e.key === "ArrowDown") {
      if (terminalState.historyIndex < terminalState.history.length - 1) {
        terminalState.historyIndex += 1;
        terminalInput.value = terminalState.history[terminalState.historyIndex];
      } else {
        terminalState.historyIndex = terminalState.history.length;
        terminalInput.value = "";
      }
      e.preventDefault();
    }
  });

  // Mensaje inicial
  printLine("Bienvenido a la terminal educativa. Escribe 'help' para empezar.", "output");
}

// ============================
// Comentarios y likes (simulado)
// ============================
const commentForm = $("#comment-form");
const commentName = $("#comment-name");
const commentText = $("#comment-text");
const commentsList = $("#comments-list");
const likeButton = $("#like-button");
const likesCounter = $("#likes-counter");
const likesStatsList = $("#likes-stats-list");
const likesEmpty = $("#likes-empty");

// Estructura en localStorage:
//  comments: [{ name, text, createdAt }]
//  likesByDate: { "YYYY-MM-DD": number }

function loadComments() {
  const raw = localStorage.getItem("web_info_comments");
  try {
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveComments(comments) {
  localStorage.setItem("web_info_comments", JSON.stringify(comments));
}

function loadLikesByDate() {
  const raw = localStorage.getItem("web_info_likesByDate");
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLikesByDate(map) {
  localStorage.setItem("web_info_likesByDate", JSON.stringify(map));
}

function renderComments() {
  if (!commentsList) return;
  const comments = loadComments();
  commentsList.innerHTML = "";

  comments
    .slice()
    .reverse()
    .forEach((c) => {
      const item = createEl("div", "comment-item");
      const meta = createEl(
        "div",
        "comment-meta",
        `${c.name || "Anónimo"} · ${new Date(c.createdAt).toLocaleString()}`
      );
      const text = createEl("div", "comment-text", c.text);
      item.appendChild(meta);
      item.appendChild(text);
      commentsList.appendChild(item);
    });
}

function getTotalLikes(likesByDate) {
  return Object.values(likesByDate).reduce((acc, v) => acc + v, 0);
}

function renderLikes() {
  if (!likesCounter || !likesStatsList || !likesEmpty) return;
  const likesByDate = loadLikesByDate();
  const total = getTotalLikes(likesByDate);

  likesCounter.textContent = String(total);

  const entries = Object.entries(likesByDate).sort(
    (a, b) => b[1] - a[1]
  );

  likesStatsList.innerHTML = "";

  if (entries.length === 0) {
    likesEmpty.style.display = "";
    return;
  }

  likesEmpty.style.display = "none";

  entries.slice(0, 5).forEach(([date, count]) => {
    const li = createEl(
      "li",
      null,
      `${date}: ${count} like${count === 1 ? "" : "s"}`
    );
    likesStatsList.appendChild(li);
  });
}

if (commentForm && commentName && commentText) {
  commentForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = commentName.value.trim() || "Anónimo";
    const text = commentText.value.trim();

    if (!text) return;

    const comments = loadComments();
    comments.push({
      name,
      text,
      createdAt: new Date().toISOString(),
    });
    saveComments(comments);

    commentText.value = "";
    renderComments();

    // Aquí podrías llamar a tu backend real:
    // saveComment({ name, text }).catch(console.error);
  });

  renderComments();
}

if (likeButton) {
  likeButton.addEventListener("click", () => {
    const likesByDate = loadLikesByDate();
    const key = getTodayKey();
    likesByDate[key] = (likesByDate[key] || 0) + 1;
    saveLikesByDate(likesByDate);
    renderLikes();

    // Aquí podrías notificar al backend:
    // registerLike(key).catch(console.error);
  });

  renderLikes();
}


