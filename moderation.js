// Sistema de moderación de comentarios
class CommentModerator {
    constructor() {
        // Lista completa de palabras prohibidas (español + inglés)
        this.badWords = this.getBadWordsList();
        
        // Variaciones comunes para evadir filtros
        this.evasionPatterns = this.getEvasionPatterns();
        
        // Palabras permitidas en contexto educativo
        this.allowedInContext = this.getAllowedWords();
    }
    
    getBadWordsList() {
        return {
            // Español
            spanish: [
                // Insultos comunes
                'estúpido', 'idiota', 'imbécil', 'tonto', 'burro',
                'pendejo', 'mierda', 'carajo', 'coño', 'verga',
                'puta', 'prostituta', 'zorra', 'cabrón', 'maricón',
                'joder', 'hostia', 'gilipollas', 'capullo', 'mamón',
                
                // Racismo/xenofobia
                'negro', 'negra', 'indio', 'india', 'chino', 'china',
                'gordo', 'gorda', 'feo', 'fea', 'viejo', 'vieja',
                
                // Acoso
                'matar', 'muerte', 'suicidio', 'violar', 'violación',
                'asesinar', 'asesinato', 'golpear', 'pegar',
                
                // Spam/fraude
                'comprar', 'vender', 'gratis', 'oferta', 'descuento',
                'dinero', 'ganar', 'rápido', 'fácil',
                
                // Drogas/alcohol
                'droga', 'marihuana', 'cocaína', 'alcohol', 'borracho',
                'fumar', 'beber', 'emborrachar'
            ],
            
            // Inglés
            english: [
                // Common insults
                'fuck', 'shit', 'ass', 'bitch', 'bastard',
                'cunt', 'dick', 'pussy', 'whore', 'slut',
                'damn', 'hell', 'crap', 'douche', 'retard',
                'moron', 'idiot', 'stupid', 'dumb', 'fool',
                
                // Racism/hate
                'nigger', 'nigga', 'chink', 'spic', 'kike',
                'fag', 'faggot', 'queer', 'tranny', 'dyke',
                'fat', 'ugly', 'old', 'retarded',
                
                // Violence
                'kill', 'death', 'murder', 'rape', 'suicide',
                'attack', 'hit', 'beat', 'shoot', 'stab',
                
                // Spam/scam
                'buy', 'sell', 'free', 'discount', 'offer',
                'money', 'win', 'fast', 'easy', 'click',
                
                // Drugs/alcohol
                'drug', 'weed', 'cocaine', 'alcohol', 'drunk',
                'smoke', 'drink', 'high', 'stoned'
            ],
            
            // Combinaciones peligrosas
            combinations: [
                'te voy a', 'te mato', 'te odio', 'te pego',
                'te violo', 'suicidate', 'mátate', 'quiero morir',
                'i kill you', 'i hate you', 'i hit you'
            ]
        };
    }
    
    getEvasionPatterns() {
        return {
            // Sustitución de letras
            letterSubstitutions: {
                'a': ['@', '4', 'α', 'а'],
                'e': ['3', 'ε', 'е'],
                'i': ['1', '!', '|', 'і', 'í'],
                'o': ['0', 'ο', 'о', 'ó'],
                's': ['5', '$', 'z', 'с'],
                't': ['7', '+'],
                'b': ['8', 'β'],
                'g': ['9', 'q']
            },
            
            // Separadores comunes
            separators: ['.', '-', '_', '*', ' ', ''],
            
            // Repeticiones para evadir
            repetitions: 2 // Número máximo de repeticiones permitidas
        };
    }
    
    getAllowedWords() {
        return [
            // Contexto educativo permitido
            'clase', 'profesor', 'maestro', 'estudiante', 'alumno',
            'tarea', 'examen', 'calificación', 'nota', 'aprobado',
            'reprobado', 'escuela', 'universidad', 'colegio',
            'programación', 'código', 'html', 'css', 'javascript',
            'python', 'java', 'php', 'sql', 'git', 'github',
            
            // Inglés educativo
            'class', 'teacher', 'student', 'homework', 'exam',
            'grade', 'school', 'university', 'college',
            'programming', 'code', 'debug', 'compile', 'function',
            'variable', 'loop', 'array', 'object', 'string'
        ];
    }
    
    // Método principal para moderar texto
    moderate(text) {
        if (!text || typeof text !== 'string') {
            return { safe: false, reason: 'Texto inválido' };
        }
        
        const lowerText = text.toLowerCase().trim();
        
        // 1. Verificar longitud mínima/máxima
        if (lowerText.length < 3) {
            return { safe: false, reason: 'El comentario es muy corto' };
        }
        
        if (lowerText.length > 500) {
            return { safe: false, reason: 'El comentario es muy largo' };
        }
        
        // 2. Verificar palabras prohibidas directas
        const directMatch = this.checkDirectMatch(lowerText);
        if (!directMatch.safe) {
            return directMatch;
        }
        
        // 3. Verificar evasiones
        const evasionCheck = this.checkEvasion(lowerText);
        if (!evasionCheck.safe) {
            return evasionCheck;
        }
        
        // 4. Verificar combinaciones peligrosas
        const comboCheck = this.checkCombinations(lowerText);
        if (!comboCheck.safe) {
            return comboCheck;
        }
        
        // 5. Verificar spam/links
        const spamCheck = this.checkSpam(lowerText);
        if (!spamCheck.safe) {
            return spamCheck;
        }
        
        // 6. Verificar contexto educativo (opcional, puede ser muy estricto)
        const contextCheck = this.checkEducationalContext(lowerText);
        if (!contextCheck.safe) {
            return { 
                safe: false, 
                reason: 'El comentario no parece relacionado con el contenido educativo' 
            };
        }
        
        return { safe: true, reason: 'Comentario aprobado' };
    }
    
    checkDirectMatch(text) {
        // Combinar todas las palabras prohibidas
        const allBadWords = [
            ...this.badWords.spanish,
            ...this.badWords.english
        ];
        
        // Dividir texto en palabras
        const words = text.split(/\s+/);
        
        for (const word of words) {
            const cleanWord = this.cleanWord(word);
            
            for (const badWord of allBadWords) {
                if (cleanWord.includes(badWord) || badWord.includes(cleanWord)) {
                    return { 
                        safe: false, 
                        reason: `Contiene palabras no permitidas: "${badWord}"`,
                        flaggedWord: badWord
                    };
                }
            }
        }
        
        return { safe: true };
    }
    
    checkEvasion(text) {
        // Normalizar texto (quitar caracteres especiales)
        const normalized = this.normalizeText(text);
        
        // Verificar sustituciones de letras
        for (const [original, substitutions] of Object.entries(this.evasionPatterns.letterSubstitutions)) {
            for (const sub of substitutions) {
                const pattern = new RegExp(sub, 'gi');
                if (pattern.test(text)) {
                    // Reemplazar con letra original para verificar
                    const testText = text.replace(pattern, original);
                    const match = this.checkDirectMatch(testText);
                    if (!match.safe) {
                        return { 
                            safe: false, 
                            reason: 'Intento de evadir filtro detectado',
                            originalText: text,
                            normalizedText: testText
                        };
                    }
                }
            }
        }
        
        // Verificar repeticiones excesivas
        if (this.hasExcessiveRepetition(text)) {
            return { 
                safe: false, 
                reason: 'Repetición excesiva de caracteres' 
            };
        }
        
        // Verificar palabras divididas
        if (this.hasSplitWords(text)) {
            return { 
                safe: false, 
                reason: 'Posible intento de dividir palabras prohibidas' 
            };
        }
        
        return { safe: true };
    }
    
    checkCombinations(text) {
        for (const combo of this.badWords.combinations) {
            if (text.includes(combo)) {
                return { 
                    safe: false, 
                    reason: 'Combinación de palabras peligrosa detectada',
                    combination: combo
                };
            }
        }
        
        // Verificar amenazas implícitas
        const threatPatterns = [
            /(te\s+voy\s+a\s+[a-z]+)/i,
            /(i\s+will\s+[a-z]+)/i,
            /(matar|kill|hurt|dañar|pegar)/i,
            /(suicid|suicide|morir|die)/i
        ];
        
        for (const pattern of threatPatterns) {
            if (pattern.test(text)) {
                const match = text.match(pattern);
                return { 
                    safe: false, 
                    reason: 'Lenguaje amenazante detectado',
                    matched: match[0]
                };
            }
        }
        
        return { safe: true };
    }
    
    checkSpam(text) {
        // Verificar múltiples URLs
        const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
        const urls = text.match(urlPattern);
        if (urls && urls.length > 2) {
            return { 
                safe: false, 
                reason: 'Demasiados enlaces (posible spam)',
                urlCount: urls.length
            };
        }
        
        // Verificar palabras de spam
        const spamWords = ['comprar', 'vender', 'oferta', 'descuento', 'gratis',
                          'buy', 'sell', 'discount', 'free', 'click aquí'];
        
        let spamCount = 0;
        for (const word of spamWords) {
            const regex = new RegExp(word, 'gi');
            const matches = text.match(regex);
            if (matches) {
                spamCount += matches.length;
            }
        }
        
        if (spamCount > 3) {
            return { 
                safe: false, 
                reason: 'Contenido sospechoso de spam/comercial',
                spamWordCount: spamCount
            };
        }
        
        // Verificar mayúsculas excesivas (shouting)
        const upperCaseRatio = (text.match(/[A-Z]/g) || []).length / text.length;
        if (upperCaseRatio > 0.7) {
            return { 
                safe: false, 
                reason: 'Uso excesivo de mayúsculas',
                upperCaseRatio: upperCaseRatio.toFixed(2)
            };
        }
        
        return { safe: true };
    }
    
    checkEducationalContext(text) {
        // Esta verificación es opcional y puede ser ajustada
        const educationWords = this.getAllowedWords();
        
        let educationWordCount = 0;
        for (const word of educationWords) {
            if (text.includes(word)) {
                educationWordCount++;
            }
        }
        
        // Si no tiene palabras educativas, podría no estar relacionado
        // Pero no lo bloqueamos, solo lo registramos
        if (educationWordCount === 0) {
            console.log('Comentario sin palabras educativas:', text.substring(0, 50));
        }
        
        return { safe: true }; // Siempre aprobamos, solo monitoreamos
    }
    
    // Herramientas auxiliares
    cleanWord(word) {
        // Remover caracteres especiales al inicio/final
        return word.replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, '').toLowerCase();
    }
    
    normalizeText(text) {
        // Convertir sustituciones comunes a letras normales
        let normalized = text.toLowerCase();
        
        const substitutions = {
            '@': 'a', '4': 'a',
            '3': 'e',
            '1': 'i', '!': 'i',
            '0': 'o',
            '$': 's', '5': 's',
            '7': 't',
            '8': 'b',
            '9': 'g'
        };
        
        for (const [from, to] of Object.entries(substitutions)) {
            normalized = normalized.replace(new RegExp(from, 'g'), to);
        }
        
        // Remover caracteres no alfabéticos (excepto espacios)
        normalized = normalized.replace(/[^a-z\s]/g, '');
        
        return normalized;
    }
    
    hasExcessiveRepetition(text) {
        // Verificar repetición de caracteres (ej: "holaaaaaa")
        const repetitionPattern = /(.)\1{3,}/gi;
        return repetitionPattern.test(text);
    }
    
    hasSplitWords(text) {
        // Verificar si palabras prohibidas están divididas
        // Ej: "est ú pido" o "f u c k"
        const normalized = text.replace(/\s+/g, '');
        
        const allBadWords = [
            ...this.badWords.spanish,
            ...this.badWords.english
        ];
        
        for (const badWord of allBadWords) {
            if (normalized.includes(badWord)) {
                return true;
            }
        }
        
        return false;
    }
    
    // Método para censurar comentarios (opcional)
    censorText(text) {
        let censored = text;
        const allBadWords = [...this.badWords.spanish, ...this.badWords.english];
        
        for (const badWord of allBadWords) {
            const regex = new RegExp(`\\b${badWord}\\b`, 'gi');
            censored = censored.replace(regex, '*'.repeat(badWord.length));
            
            // También censurar con letras mezcladas
            const mixedRegex = new RegExp(badWord.split('').join('[^a-z]*'), 'gi');
            censored = censored.replace(mixedRegex, '*'.repeat(badWord.length));
        }
        
        return censored;
    }
    
    // Método para entrenar el filtro (aprendizaje)
    learnNewBadWord(word, language = 'spanish') {
        if (!this.badWords[language]) {
            this.badWords[language] = [];
        }
        
        if (!this.badWords[language].includes(word.toLowerCase())) {
            this.badWords[language].push(word.toLowerCase());
            console.log(`Nueva palabra añadida: ${word} (${language})`);
            return true;
        }
        
        return false;
    }
}

// Exportar para uso global
window.CommentModerator = CommentModerator;