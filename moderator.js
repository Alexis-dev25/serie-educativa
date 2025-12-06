// moderator.js - Sistema de Moderación para Comentarios
console.log("moderator.js cargado");

class CommentModerator {
    constructor() {
        // Palabras ofensivas en español e inglés
        // Se agrupan por severidad para posible future filtering
        this.bannedWords = {
            spanish: [
                // Palabras ofensivas comunes en español
                'pendejo', 'pendeja', 'pendejadas', 'pendejear',
                'mierda', 'jodida', 'jodido', 'joder',
                'puta', 'putada', 'putazo', 'putero', 'putera',
                'hijo de puta', 'hijos de puta',
                'cabrón', 'cabrona', 'cabronada',
                'coño', 'conyo',
                'culo', 'culada', 'culazo',
                'verga', 'vergada', 'vergazo',
                'boludo', 'boluda', 'boludez', 'boludes',
                'bolazos', 'bolazo',
                'quilombo', 'quilombada',
                'mogólico', 'mogólica',
                'mongólico', 'mongólica',
                'tarado', 'tarada', 'taradada',
                'retardado', 'retardada',
                'retrasado', 'retrasada',
                'imbécil', 'imbecil',
                'idiota', 'idiotas',
                'estúpido', 'estupido', 'estúpida', 'estupida',
                'cretino', 'cretina',
                'baboso', 'babosa',
                'asqueroso', 'asquerosa',
                'repugnante',
                'basura',
                'escoria',
                'gilipollas', 'gilipolla',
                'subnormal',
                'minusválido', 'minusvalido', 'minusválida', 'minusvalida',
                'loco', 'loca', 'locura',
                'psicópata', 'psicopata',
                'sociópata', 'sociopata',
                'degenerado', 'degenerada',
                'perverso', 'perversa',
                'depravado', 'depravada',
                'inmoral',
                'desalmado', 'desalmada',
                'sinvergüenza', 'sinverguenza',
                'malparido', 'malparida',
                'bastardo', 'bastarda',
                'hijoputa', 'hija de puta',
                'maricón', 'maricon', 'maricona',
                'bollera', 'boller',
                'trola', 'trollop',
                'fulana', 'fulano',
                'zorra', 'zorro',
                'prostituta', 'prostituto',
                'puto', 'puta',
                'gay', 'lesbiana', 'homosexual', // contexto neutral, pero pueden ser usados como insultos
                'negro', 'negra', 'negrilla', 'negrillo', // términos racistas
                'chino', 'china', // estereotipo
                'gitano', 'gitana', // estereotipo
                'árabe', 'arabe', // contexto neutral pero a menudo discriminatorio
                'indígena', 'indigena', // cuando se usa despectivamente
                'indio', 'india', // contexto ofensivo
                'moro', 'mora', // insulto histórico
                'paleface',
                'fascista',
                'nazi',
                'comunista', // dependiendo del contexto
                'capitalista', // dependiendo del contexto
            ],
            english: [
                // Palabras ofensivas comunes en inglés
                'ass', 'asshole', 'asswipe', 'arse', 'arsehole',
                'bastard', 'bitch', 'bitches', 'bitching', 'bitchy',
                'damn', 'dammit', 'damnit',
                'dick', 'dickhead', 'dickwad',
                'fuck', 'fucker', 'fucking', 'fuckup', 'fuckwit',
                'hell', 'hellish',
                'motherfucker', 'motherfucking', 'motherfucker',
                'piss', 'pisses', 'pissed', 'pissing',
                'shit', 'shitty', 'bullshit', 'horseshit',
                'whore', 'slut', 'skank', 'tramp',
                'crap', 'crappy',
                'twat', 'twats',
                'wanker', 'wank',
                'cunt', 'cunts',
                'cock', 'cocksucker',
                'tit', 'tits', 'titfuck',
                'pussy', 'pussies', 'pussycat',
                'nigga', 'nigger', 'niggah', 'niggah', // racial slur
                'faggot', 'fag', 'faggy', // homophobic slur
                'dyke', 'dike', // homophobic slur
                'homo', 'homos', // homophobic slur
                'queer', // context dependent, but often used as slur
                'tranny', 'trannies', // transphobic slur
                'retard', 'retarded', 'retards',
                'tard', 'tards',
                'idiot', 'idiots', 'idiotic',
                'moron', 'moronic', 'morons',
                'imbecile', 'imbeciles',
                'cretin', 'cretins',
                'dumbass', 'dumb', 'dumber', 'dumbest',
                'stupid', 'stupider', 'stupidest', 'stupidity',
                'jackass', 'jack', 'jerk', 'jerkoff',
                'loser', 'losers', 'loserish',
                'wimp', 'wimpy', 'wuss',
                'pussy', 'pussyass',
                'douche', 'douchebag', 'douchey',
                'asshat', 'hateful',
                'scumbag', 'scumbags',
                'lowlife', 'lowlifes',
                'bottom', // cuando se usa como insulto
                'trash', 'trashy',
                'garbage', 'garbagey',
                'filth', 'filthy',
                'disgusting', 'disgust',
                'repulsive', 'repugnant',
                'vile', 'vileness',
                'depraved', 'depravity',
                'corrupt', 'corruption',
                'evil', 'evilly',
                'wicked', 'wickedness',
                'immoral', 'immorality',
                'pervert', 'perverted', 'perversion',
                'psycho', 'psychos', 'psychotic',
                'sociopath', 'sociopathic',
                'insane', 'insanity', 'crazy', 'craziness',
                'whack', 'whacko', 'whacked',
                'mad', 'madness',
                'psyche', // cuando se usa despectivamente
                'freak', 'freaks', 'freaky',
                'sicko', 'sick', 'sickly', // contexto ofensivo
                'perv', 'pervs', 'pervy',
                'deviant', 'deviants', 'deviance',
                'abomination', 'abominable',
                'scourge', 'curse', 'cursed',
                'plague',
                'vermin', 'vermins',
                'pest', 'pests',
                'pestilence',
                'filthy', 'filth',
                'unclean', 'contaminated', 'tainted',
                'poisoned', 'poison', 'toxic', 'toxin',
                'disease', 'diseased', 'sickly',
                'plague', 'plagued',
                'infected', 'infection', 'infest',
                'vermin', 'vermins',
                'parasite', 'parasites', 'parasitic',
                'leech', 'leeches', 'leeching',
                'vampire', 'vampires', 'vampiric',
                'demon', 'demons', 'demonic', 'demonize',
                'devil', 'devils', 'devilish', 'devilry',
                'fiend', 'fiends', 'fiendish',
                'monster', 'monsters', 'monstrous',
                'beast', 'beasts', 'beastly', 'beastial',
                'creature', 'creatures',
                'animal', 'animals', // cuando se refiere despectivamente a personas
                'savage', 'savagery', 'savages',
                'barbarian', 'barbarians', 'barbaric',
                'primitive', 'primitives',
                'uncivilized', 'uncivil',
                'wild', 'wildness',
                'untamed', 'taming',
                'feral', 'ferocious', 'ferocity',
                'brutal', 'brute', 'brutes', 'brutality', 'brutish',
                'crude', 'crudeness', 'crudity',
                'vulgar', 'vulgarity', 'vulgarian',
                'gross', 'grossness',
                'obscene', 'obscenity',
                'indecent', 'indecency',
                'lewd', 'lewdness',
                'lascivious', 'lasciviousness',
                'licentious',
                'lustful', 'lust',
                'lecherous', 'lecher', 'lechery',
                'libertine', 'libertines',
                'debauched', 'debauchery', 'debauch',
                'dissolute', 'dissipated',
                'profligate', 'profligacy',
                'wanton', 'wantonness',
                'salacious', 'salaciousness',
                'prurient', 'prurience',
                'sensual', 'sensuality', 'sensualism', // contexto ofensivo
                'hedonistic', 'hedonism', 'hedonist',
                'libertarian', // cuando se usa despectivamente
                'racist', 'racism', 'racial', 'racially',
                'sexist', 'sexism', 'sexist',
                'misogynist', 'misogyny', 'misogynistic',
                'misandrist', 'misandry',
                'homophobe', 'homophobic', 'homophobia',
                'transphobe', 'transphobic', 'transphobia',
                'xenophobe', 'xenophobic', 'xenophobia',
                'islamophobe', 'islamophobic', 'islamophobia',
                'antisemite', 'antisemitic', 'antisemitism',
                'apartheid',
                'colonialism', 'colonialist',
                'imperialism', 'imperialist',
                'fascism', 'fascist', 'fascistic',
                'nazism', 'nazi', 'nazification',
                'communism', 'communist', 'communistic', // contexto político
                'capitalism', 'capitalist', 'capitalistic', // contexto político
                'totalitarian', 'totalitarianism',
                'authoritarian', 'authoritarianism',
            ]
        };

        // Patrones de evasión comunes (números por letras, caracteres especiales, etc.)
        this.evasionPatterns = [
            { pattern: /[0-9]/g, replacement: '' }, // Eliminar números
            { pattern: /[\*\!\@\#\$\%\^\&]/g, replacement: '' }, // Eliminar caracteres especiales
            { pattern: /\s+/g, replacement: '' }, // Eliminar espacios
        ];

        // Construir expresiones regulares para buscar palabras
        this.buildRegexes();
    }

    buildRegexes() {
        // Combinar todas las palabras en una sola expresión regular por idioma
        const allSpanish = this.bannedWords.spanish.join('|');
        const allEnglish = this.bannedWords.english.join('|');

        // Usar límites de palabra para evitar falsos positivos (ej: "ass" en "assistant")
        this.spanishRegex = new RegExp(`\\b(${allSpanish})\\b`, 'gi');
        this.englishRegex = new RegExp(`\\b(${allEnglish})\\b`, 'gi');
    }

    moderate(text) {
        if (!text || typeof text !== 'string') {
            return { safe: false, reason: 'Texto inválido' };
        }

        const cleanedText = text.trim();

        // 1. Validar longitud
        if (cleanedText.length === 0) {
            return { safe: false, reason: 'El comentario está vacío' };
        }
        if (cleanedText.length < 3) {
            return { safe: false, reason: 'El comentario debe tener al menos 3 caracteres' };
        }
        if (cleanedText.length > 500) {
            return { safe: false, reason: 'El comentario no puede exceder 500 caracteres' };
        }

        // 2. Detectar palabras ofensivas (español e inglés)
        const spanishMatch = cleanedText.match(this.spanishRegex);
        const englishMatch = cleanedText.match(this.englishRegex);

        if (spanishMatch) {
            return {
                safe: false,
                reason: 'Contiene lenguaje inapropiado (palabra ofensiva detectada)',
                flaggedWord: spanishMatch[0],
                language: 'spanish'
            };
        }

        if (englishMatch) {
            return {
                safe: false,
                reason: 'Contiene lenguaje inapropiado (palabra ofensiva detectada)',
                flaggedWord: englishMatch[0],
                language: 'english'
            };
        }

        // 3. Detectar intento de evasión (palabras sin vocales o distorsionadas)
        if (this.detectEvasionAttempt(cleanedText)) {
            return {
                safe: false,
                reason: 'Posible intento de evadir filtro de contenido'
            };
        }

        // 4. Detectar repetición excesiva de caracteres
        if (this.detectExcessiveRepetition(cleanedText)) {
            return {
                safe: false,
                reason: 'Repetición excesiva de caracteres detectada'
            };
        }

        // 5. Detectar spam/contenido comercial (URLs, emails, etc.)
        if (this.detectSpam(cleanedText)) {
            return {
                safe: false,
                reason: 'Detectado posible spam o contenido comercial'
            };
        }

        // 6. Detectar lenguaje amenazante
        if (this.detectThreateningLanguage(cleanedText)) {
            return {
                safe: false,
                reason: 'Lenguaje amenazante detectado'
            };
        }

        // Todo pasó las validaciones
        return { safe: true };
    }

    detectEvasionAttempt(text) {
        // Aplicar patrones de limpieza
        let testText = text.toLowerCase();
        for (const pattern of this.evasionPatterns) {
            testText = testText.replace(pattern.pattern, pattern.replacement);
        }

        // Comprobar si el texto limpiado coincide con palabras prohibidas
        const spanishMatch = testText.match(this.spanishRegex);
        const englishMatch = testText.match(this.englishRegex);

        return !!(spanishMatch || englishMatch);
    }

    detectExcessiveRepetition(text) {
        // Detectar más de 3 caracteres repetidos consecutivos (ej: "jajajaja", "oooooh")
        return /(.)\1{3,}/i.test(text);
    }

    detectSpam(text) {
        // Detectar URLs
        const urlPattern = /https?:\/\/|www\.|\.com|\.net|\.org|\.es/i;
        if (urlPattern.test(text)) {
            return true;
        }

        // Detectar emails
        const emailPattern = /.+@.+\..+/;
        if (emailPattern.test(text)) {
            return true;
        }

        // Detectar teléfonos (patrones simples)
        const phonePattern = /\d{7,}/;
        if (phonePattern.test(text) && text.match(/\d/g).length > 5) {
            return true;
        }

        // Detectar demasiados números
        const digitRatio = (text.match(/\d/g) || []).length / text.length;
        if (digitRatio > 0.3) {
            return true;
        }

        return false;
    }

    detectThreateningLanguage(text) {
        const threateningPatterns = [
            /voy a (matarte|matarte|matar|golpear|pegar|herir|lastimar)/i,
            /te voy a (matar|golpear|pegar|herir|lastimar)/i,
            /kill|hurt|harm|death threat/i,
            /suicidio|suicidarse|matarme/i,
            /bomba|explosivo|arma|pistola|revólver|cuchillo/i,
        ];

        for (const pattern of threateningPatterns) {
            if (pattern.test(text)) {
                return true;
            }
        }

        return false;
    }

    censorText(text) {
        // Censurar palabras ofensivas (reemplazarlas con asteriscos)
        let censored = text;
        censored = censored.replace(this.spanishRegex, (match) => '*'.repeat(match.length));
        censored = censored.replace(this.englishRegex, (match) => '*'.repeat(match.length));
        return censored;
    }
}

// Hacer disponible globalmente
window.CommentModerator = CommentModerator;
console.log("CommentModerator disponible como window.CommentModerator");
