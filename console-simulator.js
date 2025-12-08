/**
 * Simulador de Consola para diferentes lenguajes
 * Proporciona evaluación de código JavaScript y simulación para otros lenguajes
 */

class ConsoleSimulator {
    constructor(language = 'javascript') {
        this.language = language;
        this.output = [];
        this.variables = {};
        this.pythonCode = '';
    }

    /**
     * Ejecuta código JavaScript
     */
    executeJavaScript(code) {
        this.output = [];
        try {
            // Crear un contexto seguro para la ejecución
            const originalLog = console.log;
            const originalError = console.error;

            const logs = [];
            console.log = (...args) => {
                logs.push(args.map(arg => this.formatValue(arg)).join(' '));
            };
            console.error = (...args) => {
                logs.push('ERROR: ' + args.join(' '));
            };

            // Ejecutar el código
            eval(code);

            console.log = originalLog;
            console.error = originalError;

            this.output = logs;
            return { success: true, output: logs };
        } catch (error) {
            this.output = [`ERROR: ${error.message}`];
            return { success: false, output: [`ERROR: ${error.message}`] };
        }
    }

    /**
     * Simula ejecución de código Python
     * (Esta es una simulación mejorada que interpreta variables y f-strings)
     */
    executePython(code) {
        this.output = [];
        try {
            const lines = code.split('\n');
            
            for (let line of lines) {
                const trimmed = line.trim();
                
                // Ignorar líneas vacías y comentarios
                if (!trimmed || trimmed.startsWith('#')) {
                    continue;
                }

                // Asignaciones de variables: nombre = valor
                if (trimmed.includes('=') && !trimmed.includes('==') && !trimmed.startsWith('print')) {
                    const [varName, ...valueParts] = trimmed.split('=');
                    const varNameClean = varName.trim();
                    let value = valueParts.join('=').trim();
                    
                    try {
                        // Reemplazar nombres de variables en la expresión
                        let evaluableValue = value;
                        for (const [vName, vValue] of Object.entries(this.variables)) {
                            const regex = new RegExp(`\\b${vName}\\b`, 'g');
                            evaluableValue = evaluableValue.replace(regex, 
                                typeof vValue === 'string' ? `"${vValue}"` : vValue);
                        }
                        this.variables[varNameClean] = eval(evaluableValue);
                    } catch {
                        // Si falla la evaluación, guardar como string
                        this.variables[varNameClean] = value.replace(/['"]/g, '');
                    }
                    continue;
                }

                // print() - Imprime strings, variables, f-strings
                if (trimmed.startsWith('print(')) {
                    const printContent = trimmed.slice(6, -1); // Obtener contenido entre print( y )
                    let output = this.evaluatePrintContent(printContent);
                    this.output.push(output);
                    continue;
                }

                // Operaciones simples (comentarios ignorados)
                if (trimmed && !trimmed.startsWith('#')) {
                    // Si es solo un nombre de variable, mostrar su valor
                    if (trimmed in this.variables) {
                        this.output.push(String(this.variables[trimmed]));
                    }
                }
            }

            return { success: true, output: this.output };
        } catch (error) {
            this.output = [`ERROR: ${error.message}`];
            return { success: false, output: [`ERROR: ${error.message}`] };
        }
    }

    /**
     * Evalúa el contenido de un print()
     */
    evaluatePrintContent(content) {
        content = content.trim();

        // f-string: f"texto {variable} más texto"
        if (content.startsWith('f"') || content.startsWith("f'")) {
            const quote = content[1];
            const stringContent = content.slice(2, -1);
            
            let result = stringContent;
            // Reemplazar {variable} con su valor
            result = result.replace(/\{([^}]+)\}/g, (match, varName) => {
                varName = varName.trim();
                if (varName in this.variables) {
                    return this.variables[varName];
                }
                return match;
            });
            return result;
        }

        // String normal: "texto" o 'texto'
        if ((content.startsWith('"') && content.endsWith('"')) ||
            (content.startsWith("'") && content.endsWith("'"))) {
            return content.slice(1, -1);
        }

        // Variable: print(nombre)
        if (content in this.variables) {
            return String(this.variables[content]);
        }

        // Expresión: print(a + b), print(10 * 5)
        try {
            let evaluableContent = content;
            for (const [vName, vValue] of Object.entries(this.variables)) {
                const regex = new RegExp(`\\b${vName}\\b`, 'g');
                evaluableContent = evaluableContent.replace(regex,
                    typeof vValue === 'string' ? `"${vValue}"` : vValue);
            }
            return String(eval(evaluableContent));
        } catch {
            return content;
        }
    }

    /**
     * Ejecuta código según el lenguaje
     */
    execute(code) {
        switch (this.language.toLowerCase()) {
            case 'javascript':
            case 'js':
                return this.executeJavaScript(code);
            case 'python':
                return this.executePython(code);
            default:
                return { success: false, output: ['Lenguaje no soportado'] };
        }
    }

    /**
     * Formatea valores para la salida
     */
    formatValue(value) {
        if (value === undefined) return 'undefined';
        if (value === null) return 'null';
        if (typeof value === 'string') return value;
        if (typeof value === 'object') return JSON.stringify(value, null, 2);
        return String(value);
    }

    /**
     * Obtiene el historial de salida
     */
    getOutput() {
        return this.output;
    }

    /**
     * Limpia la salida
     */
    clear() {
        this.output = [];
        this.variables = {};
    }
}

/**
 * Crea la interfaz visual del simulador
 */
function createConsoleUI(containerId, language = 'javascript', examples = []) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const simulator = new ConsoleSimulator(language);

    container.innerHTML = `
        <div class="console-simulator">
            <div class="console-header">
                <h3>💻 Simulador de Consola - ${language.toUpperCase()}</h3>
            </div>
            
            <div class="console-examples">
                <label for="code-examples">Ejemplos: </label>
                <select id="code-examples" aria-label="Seleccionar ejemplo">
                    <option value="">-- Selecciona un ejemplo --</option>
                    ${examples.map((ex, i) => `<option value="${i}">${ex.name}</option>`).join('')}
                </select>
            </div>

            <div class="console-editor">
                <label for="code-input">Código:</label>
                <textarea 
                    id="code-input" 
                    class="code-input" 
                    placeholder="Escribe tu código aquí..."
                    aria-label="Área de código"
                ></textarea>
            </div>

            <div class="console-buttons">
                <button id="console-run" class="btn-primary">▶ Ejecutar</button>
                <button id="console-clear" class="btn-secondary">🗑️ Limpiar</button>
            </div>

            <div class="console-output">
                <h4>Salida:</h4>
                <pre id="console-output-text"></pre>
            </div>
        </div>
    `;

    const examplesSelect = document.getElementById('code-examples');
    const codeInput = document.getElementById('code-input');
    const outputText = document.getElementById('console-output-text');
    const runBtn = document.getElementById('console-run');
    const clearBtn = document.getElementById('console-clear');

    // Cargar ejemplo
    examplesSelect.addEventListener('change', (e) => {
        const index = parseInt(e.target.value);
        if (examples[index]) {
            codeInput.value = examples[index].code;
        }
    });

    // Ejecutar código
    runBtn.addEventListener('click', () => {
        const code = codeInput.value;
        const result = simulator.execute(code);
        outputText.textContent = result.output.join('\n') || 'Sin salida';
        outputText.parentElement.classList.toggle('error', !result.success);
    });

    // Limpiar
    clearBtn.addEventListener('click', () => {
        codeInput.value = '';
        outputText.textContent = '';
        simulator.clear();
    });

    return simulator;
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ConsoleSimulator, createConsoleUI };
}
