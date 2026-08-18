// ==========================================
// 0. CONFIGURAZIONE CLOUD FIRESTORE REALE
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyCCNywuFBpcNMdhNtaGDxqFWRI-_9_-dcc",
  authDomain: "lupus-in-fabula-d1197.firebaseapp.com",
  projectId: "lupus-in-fabula-d1197",
  storageBucket: "lupus-in-fabula-d1197.firebasestorage.app",
  messagingSenderId: "149902777417",
  appId: "1:149902777417:web:95cc3cf21735fe8a6c3398"
};

let db = null;
try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    console.log("🔥 Cloud Firestore connesso con successo!");
} catch (e) {
    console.warn("Firestore fallback su memoria locale:", e);
}

// ==========================================
// 1. DATABASE RUOLI & VARIANTI GRAFICHE
// ==========================================
const rolesDB = [
    { id: 'lupo', name: 'Lupo', type: 'multiple', faction: 'Lupi', icon: '🐺', desc: 'Di notte cacci col branco scegliendo all\'unanimità chi sbranare.' },
    { id: 'lupo_alpha', name: 'Lupo Alpha', type: 'unique', faction: 'Lupi', icon: '🐺👑', desc: 'Partecipa al branco e possiede una kill autonoma extra una tantum.' },
    { id: 'assassino', name: 'Assassino', type: 'unique', faction: 'Solo', icon: '🔪', desc: 'Vince se indovina e uccide il numero richiesto di ruoli esatti.' },
    { id: 'veggente', name: 'Veggente', type: 'unique', faction: 'Villici', icon: '🔮', desc: 'Ogni notte scopre se un giocatore vivente è un Lupo o Non-Lupo.' },
    { id: 'medium', name: 'Medium', type: 'unique', faction: 'Villici', icon: '🪦', desc: 'Dalla seconda notte interroga un defunto per scoprirne la categoria.' },
    { id: 'dama', name: 'Dama', type: 'unique', faction: 'Villici', icon: '💃', desc: 'Protegge un giocatore ogni notte dalla morte (non la stessa persona per 2 notti).' },
    { id: 'guardia', name: 'Guardia del Corpo', type: 'unique', faction: 'Villici', icon: '🛡️', desc: 'Sorveglia un bersaglio (non sé stessa). Se attaccato lo salva e scopre l\'aggressore.' },
    { id: 'licantropo', name: 'Licantropo', type: 'unique', faction: 'Villici', icon: '🌕', desc: 'Inizia come villico. Se morso dai Lupi, non muore ma si trasforma in Lupo.' },
    { id: 'pazzo', name: 'Pazzo', type: 'unique', faction: 'Solo', icon: '🤪', desc: 'Vince immediatamente e da solo se il villaggio lo manda al Rogo!' },
    { id: 'cieco', name: 'Cieco', type: 'unique', faction: 'Villici', icon: '👁️', desc: 'Confronta due giocatori per scoprire se appartengono alla stessa fazione (max 3 usi).' },
    { id: 'monaca', name: 'Monaca Silente', type: 'unique', faction: 'Villici', icon: '🙏', desc: 'Protegge un bersaglio dalla condanna al rogo per il giorno successivo (max 2 usi).' },
    { id: 'cappuccetto', name: 'Cappuccetto Rosso', type: 'unique', faction: 'Villici', icon: '👧', desc: 'La primissima notte scopre l\'identità segreta di uno dei Lupi.' },
    { id: 'censuratore', name: 'Censuratore', type: 'unique', faction: 'Villici', icon: '🔕', desc: 'Durante il voto diurno può annullare in segreto 1 voto contro un sospettato.' },
    { id: 'appestato', name: 'Appestato', type: 'unique', faction: 'Villici', icon: '☣️', desc: 'Se sbranato trascina chi lo ha ucciso nella tomba. Muore solo dopo la 3ª notte.' },
    { id: 'amanti', name: 'Amanti', type: 'unique', faction: 'Villici', icon: '❤️', desc: 'Dormono a turno in una casa. Se attaccati lì muoiono entrambi; a casa vuota sopravvivono!' },
    { id: 'villico', name: 'Villico', type: 'multiple', faction: 'Villici', icon: '🌾', desc: 'Nessun potere speciale, ma la tua parola e il tuo voto sono fondamentali.' }
];

const roleImagePool = {
    amanti: ['assets/amanti_1.png', 'assets/amanti_2.png'],
    lupo: ['assets/lupo_1.png', 'assets/lupo_2.png', 'assets/lupo_3.png', 'assets/lupo_4.png', 'assets/lupo.png'],
    villico: ['assets/villico_1.png', 'assets/villico_2.png', 'assets/villico_3.png', 'assets/villico_4.png', 'assets/villico_5.png', 'assets/villico.png']
};

const HUD_ROLE_ORDER = [
    'lupo', 'lupo_alpha', 'assassino', 'veggente', 'medium',
    'dama', 'guardia', 'licantropo', 'pazzo', 'cieco',
    'monaca', 'cappuccetto', 'censuratore', 'appestato',
    'amanti', 'villico'
];

// ==========================================
// 2. LIBRERIA NARRATIVA & SHUFFLE-BAG
// ==========================================
const NARRATION_MASTER_LIB = {
    dusk: [
        "Il sole scompare dietro le creste montuose. Le porte vengono serrate con pesanti catene: cala la notte, chiudete tutti gli occhi...",
        "Le campane della torre battono i rintocchi della sera. Un silenzio di piombo avvolge la piazza. Chiudete tutti gli occhi...",
        "Un vento gelido spegne le ultime fiaccole. Il buio inghiotte ogni cosa: villici e mostri, chiudete tutti gli occhi...",
        "Le ombre si allungano sui vicoliacci deserti. La caccia notturna ha inizio: chiudete tutti gli occhi...",
        "Il cielo si tinge del colore del sangue antico. Ognuno si rintani nel proprio giaciglio: chiudete tutti gli occhi...",
        "Le bestie cominciano ad affilare gli artigli nel bosco. Il villaggio dorme: chiudete tutti gli occhi...",
        "Le tenebre calano senza pietà sulla vallata. Non osate aprire gli occhi fino al canto del gallo: chiudete tutti gli occhi..."
    ],
    dawnPeace: [
        "Le prime luci dell'alba accarezzano i tetti di pietra. I lupi hanno ululato a vuoto stanotte: nessuno è caduto vittima delle tenebre!",
        "Il canto del gallo risuona nella vallata. Nessun corpo giace in terra: le difese e la provvidenza hanno vegliato sui vivi.",
        "Il villaggio si risveglia tirando un sospiro di sollievo: la notte è trascorsa calma e tutte le case aprono gli scuri senza macchie di sangue.",
        "Una fitta nebbia mattutina si alza dalla piazza, ma tutti i villici escono dalle loro dimore illesi. Nessuna vittima stanotte!",
        "I lupi hanno braccato la preda sbagliata nel buio. L'alba sorge limpida e senza lutto.",
        "Nonostante i rumori sinistri tra gli alberi, la notte non ha mietuto anime. Tutti i respiri sono ancora salvi."
    ],
    dawnSingleDeath: [
        "Le tenebre si diradano lasciando spazio all'orrore. Il villaggio piange la tragica fine di {DEAD}, il cui corpo giace sbranato nella piazza.",
        "L'alba porta con sé un presagio funesto. Il silenzio del mattino è rotto dal ritrovamento dei resti insanguinati di {DEAD}.",
        "Il sole sorge, ma non per tutti. Le zanne della notte hanno reciso l'esistenza di {DEAD}.",
        "Una scia di sangue conduce davanti alla porta di {DEAD}, che non vedrà mai più la luce del giorno.",
        "Gli artigli hanno colpito nel sonno più profondo. {DEAD} è caduto senza poter emettere alcun grido d'aiuto.",
        "Il villaggio si raduna sconvolto: la furia notturna ha strappato via per sempre {DEAD}."
    ],
    dawnMultiDeath: [
        "Una vera carneficina ha bagnato la notte. Il villaggio scopre con raccapriccio i corpi esanimi di {DEAD}!",
        "La notte è stata crudele e famelica oltre ogni misura. I caduti di questa alba nera sono {DEAD}.",
        "Doppio lutto per il villaggio: la terra è ancora calda del sangue di {DEAD}."
    ],
    dawnPlague: [
        "Un lezzo pestilenziale si diffonde nell'aria: la maledizione dell'Appestato ha trascinato nella tomba anche il suo assalitore!"
    ],
    dawnLycan: [
        "Una vibrazione sinistra attraversa la terra: un Licantropo è stato morso e ha completato la sua mutazione nel branco!"
    ],
    rogoCondemn: [
        "Le fiamme si levano alte verso il cielo. Il verdetto del villaggio è compiuto: {NAME} brucia sul rogo!",
        "La folla inferocita trascina {NAME} sulla pira. La giustizia popolare è stata consumata tra le ceneri.",
        "Il fumo nero avvolge la piazza. Il villaggio ha sacrificato {NAME} nella speranza di estirpare il male."
    ],
    rogoReprieve: [
        "Il villaggio ha mormorato ma non ha trovato il coraggio: gli astenuti superano i voti e la pira rimane spenta!",
        "Le accuse si sono disperse nel vento. Nessuno è stato condannato al rogo oggi.",
        "La piazza si svuota nel dubbio più totale: nessun rogo viene acceso per oggi."
    ],
    referendumTieIntro: [
        "Le accuse sono spaccate a metà tra {CANDIDATES}! I due accusati tacciono: tocca al resto del villaggio decidere il loro destino!",
        "Parità assoluta tra i sospettati {CANDIDATES}. Si apre il Referendum di Spareggio: il villaggio è costretto a scegliere chi bruciare!"
    ],
    referendumCondemnIntro: [
        "I voti su {NAME} equivalgono esattamente al numero di chi voleva astenersi! Si apre il Referendum di Condanna: ELIMINARE o GRAZIARE?"
    ]
};

let phraseBags = {};

function getUniqueNarration(category) {
    if (!phraseBags[category] || phraseBags[category].length === 0) {
        phraseBags[category] = cryptoShuffle([...NARRATION_MASTER_LIB[category]]);
    }
    return phraseBags[category].pop();
}

function cryptoShuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const randomBuffer = new Uint32Array(1);
        window.crypto.getRandomValues(randomBuffer);
        const j = randomBuffer[0] % (i + 1);
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// ==========================================
// 3. STATO GLOBALE DELLA PARTITA
// ==========================================
let gameState = {
    players: [],
    selectedRoles: {},
    deck: [],
    roster: [],
    nightNumber: 1,
    nightSteps: [],
    currentStepIdx: 0,
    nightActions: {},
    abstentions: 0,
    votesMap: {},
    referendum: {
        active: false,
        type: null,
        candidates: [],
        votes: {}
    },
    history: {
        lastDamaTarget: null,
        lastGuardiaTarget: null,
        lastCensuredTarget: null,
        lastCiecoPair: null,
        assassinoKills: 0,
        assassinoBlocked: false,
        ciecoUses: 0,
        monacaUses: 0,
        alphaKillsUsed: 0
    }
};

let currentDistIndex = 0;
let isCardRevealed = false;

// ==========================================
// 4. INIZIALIZZAZIONE & FIRESTORE
// ==========================================
function initApp() {
    renderRolesGrid();
    loadSavedPlayers();
    setupSwipeGesture();
}

async function loadSavedPlayers() {
    if (db) {
        try {
            const snapshot = await db.collection("players").get();
            const players = [];
            snapshot.forEach(doc => players.push(doc.data().name));
            if (players.length > 0) {
                renderSavedPlayersList(players);
                return;
            }
        } catch (e) {
            console.error("Errore fetch Firestore:", e);
        }
    }
    const local = JSON.parse(localStorage.getItem('lupus_saved_players') || '[]');
    renderSavedPlayersList(local);
}

async function savePlayerCloud(name) {
    let local = JSON.parse(localStorage.getItem('lupus_saved_players') || '[]');
    if (!local.includes(name)) {
        local.push(name);
        localStorage.setItem('lupus_saved_players', JSON.stringify(local));
    }

    if (db) {
        try {
            await db.collection("players").doc(name).set({ name: name, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
        } catch (e) {
            console.error("Errore salvataggio Firestore:", e);
        }
    }
    loadSavedPlayers();
}

async function removePlayerCloud(name, e) {
    e.stopPropagation();
    let local = JSON.parse(localStorage.getItem('lupus_saved_players') || '[]').filter(p => p !== name);
    localStorage.setItem('lupus_saved_players', JSON.stringify(local));

    if (db) {
        try {
            await db.collection("players").doc(name).delete();
        } catch (e) {
            console.error("Errore eliminazione Firestore:", e);
        }
    }
    loadSavedPlayers();
}

function renderSavedPlayersList(saved) {
    const box = document.getElementById('saved-players-section');
    const container = document.getElementById('saved-players-chips');
    
    if (saved.length === 0) {
        box.classList.add('hidden');
        return;
    }
    box.classList.remove('hidden');
    container.innerHTML = saved.map(p => `
        <div class="saved-chip" onclick="addSavedPlayer('${p}')">
            <span>+ ${p}</span>
            <span class="del-mem" onclick="removePlayerCloud('${p}', event)">✕</span>
        </div>
    `).join('');
}

function addSavedPlayer(name) {
    if (!gameState.players.includes(name)) {
        gameState.players.push(name);
        renderPlayersChips();
        validateDeck();
    }
}

function renderRolesGrid() {
    const grid = document.getElementById('roles-selection');
    grid.innerHTML = '';
    rolesDB.forEach(r => {
        gameState.selectedRoles[r.id] = 0;
        grid.innerHTML += `
            <div class="role-card-item" id="role-item-${r.id}">
                <div class="role-info-left">
                    <span class="role-icon-small">${r.icon}</span>
                    <div>
                        <div class="role-name-text">${r.name}</div>
                        <div class="role-faction-sub">${r.faction}</div>
                    </div>
                </div>
                <div class="counter-pill">
                    <button onclick="updateRoleCount('${r.id}', -1)">-</button>
                    <span id="count-${r.id}">0</span>
                    <button onclick="updateRoleCount('${r.id}', 1)">+</button>
                </div>
            </div>
        `;
    });
}

function addPlayer() {
    const input = document.getElementById('player-name');
    const name = input.value.trim();
    if (!name) return;
    if (gameState.players.includes(name)) {
        alert('Giocatore già inserito in questa partita!');
        return;
    }
    gameState.players.push(name);
    savePlayerCloud(name);
    input.value = '';
    renderPlayersChips();
    validateDeck();
}

function removePlayer(name) {
    gameState.players = gameState.players.filter(p => p !== name);
    renderPlayersChips();
    validateDeck();
}

function renderPlayersChips() {
    const list = document.getElementById('players-list');
    list.innerHTML = gameState.players.map(p => `
        <div class="player-chip">
            <span>${p}</span>
            <span class="remove-btn" onclick="removePlayer('${p}')">✕</span>
        </div>
    `).join('');
    document.getElementById('player-count').innerText = gameState.players.length;
}

function updateRoleCount(roleId, delta) {
    const role = rolesDB.find(r => r.id === roleId);
    let current = gameState.selectedRoles[roleId];

    if (roleId === 'amanti') {
        if (delta > 0 && current === 0) gameState.selectedRoles[roleId] = 2;
        else if (delta < 0) gameState.selectedRoles[roleId] = 0;
    } else if (role.type === 'unique') {
        let next = current + delta;
        if (next >= 0 && next <= 1) gameState.selectedRoles[roleId] = next;
    } else {
        let next = current + delta;
        if (next >= 0) gameState.selectedRoles[roleId] = next;
    }

    document.getElementById(`count-${roleId}`).innerText = gameState.selectedRoles[roleId];
    const row = document.getElementById(`role-item-${roleId}`);
    if (gameState.selectedRoles[roleId] > 0) row.classList.add('selected');
    else row.classList.remove('selected');

    validateDeck();
}

function validateDeck() {
    const totalDeck = Object.values(gameState.selectedRoles).reduce((a, b) => a + b, 0);
    document.getElementById('deck-count').innerText = totalDeck;
    const btn = document.getElementById('btn-start');
    
    if (gameState.players.length >= 3 && gameState.players.length === totalDeck) {
        btn.disabled = false;
        btn.innerText = `CREA MAZZO E ASSEGNA (${totalDeck} GIOCATORI)`;
    } else {
        btn.disabled = true;
        btn.innerText = `CARTE: ${totalDeck} / GIOCATORI: ${gameState.players.length}`;
    }
}

// ==========================================
// 5. ASSEGNAZIONE RUOLI
// ==========================================
function startDistribution() {
    gameState.deck = [];

    const wolvesVariants = cryptoShuffle([...(roleImagePool.lupo || [])]);
    const villiciVariants = cryptoShuffle([...(roleImagePool.villico || [])]);
    let wolfVarIdx = 0;
    let villicoVarIdx = 0;

    for (const [rId, qty] of Object.entries(gameState.selectedRoles)) {
        if (rId === 'amanti' && qty === 2) {
            const roleObj = rolesDB.find(r => r.id === 'amanti');
            gameState.deck.push({ ...roleObj, cardImage: 'assets/amanti_1.png' });
            gameState.deck.push({ ...roleObj, cardImage: 'assets/amanti_2.png' });
        } else {
            const roleObj = rolesDB.find(r => r.id === rId);
            for (let i = 0; i < qty; i++) {
                let imgPath = `assets/${rId}.png`;
                if (rId === 'lupo' && wolvesVariants.length > 0) {
                    imgPath = wolvesVariants[wolfVarIdx % wolvesVariants.length];
                    wolfVarIdx++;
                } else if (rId === 'villico' && villiciVariants.length > 0) {
                    imgPath = villiciVariants[villicoVarIdx % villiciVariants.length];
                    villicoVarIdx++;
                }
                gameState.deck.push({ ...roleObj, cardImage: imgPath });
            }
        }
    }

    const shuffledPlayers = cryptoShuffle([...gameState.players]);
    const shuffledDeck = cryptoShuffle([...gameState.deck]);

    gameState.roster = shuffledPlayers.map((name, idx) => ({
        id: 'p_' + idx,
        name: name,
        role: shuffledDeck[idx],
        cardImage: shuffledDeck[idx].cardImage,
        isAlive: true,
        isWolf: shuffledDeck[idx].faction === 'Lupi'
    }));

    currentDistIndex = 0;
    
    document.getElementById('narrator-hud').classList.remove('open');
    document.getElementById('mobile-hud-btn').classList.add('hidden');
    document.getElementById('narrator-control-bar').classList.add('hidden');
    toggleMobileHUD(false);

    switchScreen('screen-distribution');
    renderDistCard();
}

function renderDistCard() {
    isCardRevealed = false;
    document.getElementById('player-card').classList.remove('flipped');
    document.getElementById('btn-next-player').classList.add('hidden');
    document.getElementById('card-caption-banner').classList.add('hidden');
    
    const p = gameState.roster[currentDistIndex];
    
    document.getElementById('dist-player-name').innerText = `TURNO DI: ${p.name.toUpperCase()}`;
    document.getElementById('dist-pass-text').innerText = `Passa il telefono a ${p.name}.`;
    document.getElementById('dist-tap-text').innerText = `${p.name}, tocca la carta per rivelarla.`;

    const frontImg = document.getElementById('card-front-image');
    frontImg.classList.remove('img-fallback-hidden');
    
    frontImg.onerror = function() {
        this.classList.add('img-fallback-hidden');
    };
    
    frontImg.src = p.cardImage;

    document.getElementById('card-role-icon').innerText = p.role.icon;
    document.getElementById('card-role-name').innerText = p.role.name.toUpperCase();
    document.getElementById('card-role-faction').innerText = `FAZIONE: ${p.role.faction}`;
    document.getElementById('card-role-desc').innerText = p.role.desc;

    document.getElementById('caption-role-name').innerText = `${p.role.name.toUpperCase()} ${p.role.icon}`;
}

function flipCard() {
    if (isCardRevealed) return;
    document.getElementById('player-card').classList.add('flipped');
    document.getElementById('dist-tap-text').innerText = "Memorizza il ruolo, poi tocca sotto per nascondere.";
    document.getElementById('btn-next-player').classList.remove('hidden');
    document.getElementById('card-caption-banner').classList.remove('hidden');
    isCardRevealed = true;
}

function nextPlayerDistribution() {
    currentDistIndex++;
    if (currentDistIndex < gameState.roster.length) {
        renderDistCard();
    } else {
        switchScreen('screen-pass-complete');
    }
}

function narratorStartGame() {
    document.getElementById('mobile-hud-btn').classList.remove('hidden');
    document.getElementById('narrator-control-bar').classList.remove('hidden');

    updateNarratorHUD();
    showDuskTransition();
}

function showDuskTransition() {
    switchScreen('screen-dusk');
    document.getElementById('bar-phase-text').innerText = `NOTTE ${gameState.nightNumber} (IN ARRIVO)`;
    
    const duskText = getUniqueNarration('dusk');
    document.getElementById('dusk-story-text').innerHTML = `"${duskText}"`;
    updateNarratorHUD();
}

// ==========================================
// 6. MOTORE NOTTE
// ==========================================
function startNightSteps() {
    gameState.nightActions = {
        guardiaTarget: null,
        damaTarget: null,
        assassinoTarget: null,
        assassinoRoleGuess: null,
        wolvesTarget: null,
        alphaWolfTarget: null,
        amantiShelter: null,
        ciecoChoice: [],
        monacaTarget: null,
        veggenteTarget: null,
        mediumTarget: null
    };

    buildNightStepsQueue();
    gameState.currentStepIdx = 0;
    switchScreen('screen-night');
    document.getElementById('bar-phase-text').innerText = `NOTTE ${gameState.nightNumber} (FASI)`;
    document.getElementById('night-number-badge').innerText = `NOTTE ${gameState.nightNumber}`;
    renderNightStep();
}

function buildNightStepsQueue() {
    const steps = [];
    const hasRole = (rId) => gameState.roster.some(p => p.role.id === rId);
    const livingAmanti = gameState.roster.filter(p => p.role.id === 'amanti' && p.isAlive);

    if (livingAmanti.length === 2) {
        steps.push({
            id: 'amanti_shelter',
            title: 'CASA DEGLI AMANTI',
            icon: '❤️',
            roleId: 'amanti',
            prompt: gameState.nightNumber === 1 
                ? 'Gli Amanti si svegliano, si riconoscono e scelgono a casa di chi dormire!'
                : 'Gli Amanti scelgono in quale delle due case passeranno la notte insieme.'
        });
    }

    if (gameState.nightNumber === 1 && hasRole('cappuccetto')) {
        steps.push({ id: 'cappuccetto', title: 'CAPPUCCETTO ROSSO', icon: '👧', roleId: 'cappuccetto', prompt: 'Mostra in segreto l\'identità del Lupo indicato dall\'app a Cappuccetto Rosso.' });
    }

    if (hasRole('guardia')) {
        steps.push({ id: 'guardia', title: 'GUARDIA DEL CORPO', icon: '🛡️', roleId: 'guardia', prompt: 'Chi vuoi sorvegliare stanotte?' });
    }
    if (hasRole('dama')) {
        steps.push({ id: 'dama', title: 'DAMA', icon: '💃', roleId: 'dama', prompt: 'Chi vuoi proteggere nel tuo letto stanotte?' });
    }
    if (hasRole('assassino')) {
        steps.push({ id: 'assassino', title: 'ASSASSINO', icon: '🔪', roleId: 'assassino', prompt: 'Di chi vuoi indovinare il ruolo per sferrare il colpo mortale?' });
    }
    
    steps.push({ id: 'lupi', title: 'BRANCO DEI LUPI', icon: '🐺', roleId: 'lupo', prompt: 'Chi avete deciso all\'unanimità di sbranare stanotte?' });

    if (hasRole('lupo_alpha')) {
        steps.push({ id: 'lupo_alpha', title: 'LUPO ALPHA (KILL EXTRA)', icon: '🐺👑', roleId: 'lupo_alpha', prompt: 'Vuoi usare il tuo colpo letale autonomo stanotte?' });
    }

    if (hasRole('cieco')) {
        steps.push({ id: 'cieco', title: 'CIECO', icon: '👁️', roleId: 'cieco', prompt: 'Indica due persone per scoprire se appartengono alla stessa fazione.' });
    }
    if (hasRole('monaca')) {
        steps.push({ id: 'monaca', title: 'MONACA SILENTE', icon: '🙏', roleId: 'monaca', prompt: 'Chi vuoi proteggere dal rogo di domani?' });
    }
    if (hasRole('veggente')) {
        steps.push({ id: 'veggente', title: 'VEGGENTE', icon: '🔮', roleId: 'veggente', prompt: 'Di chi vuoi scrutare la vera anima?' });
    }
    if (gameState.nightNumber > 1 && hasRole('medium')) {
        steps.push({ id: 'medium', title: 'MEDIUM', icon: '🪦', roleId: 'medium', prompt: 'Di quale anima defunta vuoi conoscere la fazione?' });
    }
    if (hasRole('guardia')) {
        steps.push({ id: 'guardia_feedback', title: 'GUARDIA (RESPONSO)', icon: '🛡️', roleId: 'guardia', prompt: 'Comunica alla Guardia se ha intercettato un attacco.' });
    }

    gameState.nightSteps = steps;
}

function renderNightStep() {
    const step = gameState.nightSteps[gameState.currentStepIdx];
    document.getElementById('night-step-indicator').innerText = `Fase ${gameState.currentStepIdx + 1}/${gameState.nightSteps.length}`;
    document.getElementById('caller-icon').innerText = step.icon;
    document.getElementById('caller-title').innerText = step.title;
    document.getElementById('caller-prompt').innerText = `"${step.prompt}"`;

    const playersOfRole = gameState.roster.filter(p => p.role.id === step.roleId);
    let ownerName = '';

    if (playersOfRole.length > 1) {
        ownerName = playersOfRole.map(p => p.isAlive ? p.name : `${p.name} (MORTO)`).join(' e ');
    } else if (playersOfRole.length === 1) {
        const p = playersOfRole[0];
        ownerName = p.isAlive ? p.name : `${p.name} (MORTO - Chiama a vuoto per bluffare)`;
    } else {
        ownerName = 'Branco dei Lupi';
    }

    document.getElementById('caller-player-name').innerHTML = `Ruolo di: <strong>${ownerName}</strong>`;

    const panel = document.getElementById('action-panel');
    panel.innerHTML = '';

    const living = gameState.roster.filter(p => p.isAlive);
    const dead = gameState.roster.filter(p => !p.isAlive);

    if (step.id === 'amanti_shelter') {
        const amantiMembers = gameState.roster.filter(p => p.role.id === 'amanti' && p.isAlive);
        amantiMembers.forEach(am => {
            panel.innerHTML += `<button class="target-btn" onclick="selectNightTarget('amantiShelter', '${am.id}', this)">🏠 Casa di ${am.name}</button>`;
        });
    } else if (step.id === 'cappuccetto') {
        const aWolf = gameState.roster.find(p => p.isWolf);
        panel.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:15px; background:#1b2030; border-radius:8px; border:1px solid var(--gold-dark);">
            Lupo da mostrare a Cappuccetto: <br><strong style="color:var(--gold); font-size:1.3rem;">🐺 ${aWolf ? aWolf.name : 'Nessun Lupo'}</strong>
        </div>`;
    } else if (step.id === 'dama') {
        living.forEach(p => {
            const isBlocked = (p.id === gameState.history.lastDamaTarget);
            panel.innerHTML += `<button class="target-btn ${isBlocked ? 'disabled' : ''}" ${isBlocked ? 'disabled' : ''} onclick="selectNightTarget('damaTarget', '${p.id}', this)">
                ${p.name} ${isBlocked ? '<small style="display:block; font-size:0.7rem;">(Protetta ieri)</small>' : ''}
            </button>`;
        });
        panel.innerHTML += `<button class="target-btn" style="border-style:dashed;" onclick="selectNightTarget('damaTarget', null, this)">Non protegge nessuno</button>`;
    } else if (step.id === 'guardia') {
        const guardiaPlayer = gameState.roster.find(p => p.role.id === 'guardia');
        living.forEach(p => {
            const isSelf = guardiaPlayer && p.id === guardiaPlayer.id;
            const isBlocked = (p.id === gameState.history.lastGuardiaTarget);
            const cannotPick = isSelf || isBlocked;
            let note = isSelf ? '(Te stessa)' : (isBlocked ? '(Sorvegliato ieri)' : '');
            panel.innerHTML += `<button class="target-btn ${cannotPick ? 'disabled' : ''}" ${cannotPick ? 'disabled' : ''} onclick="selectNightTarget('guardiaTarget', '${p.id}', this)">
                ${p.name} ${cannotPick ? `<small style="display:block; font-size:0.7rem;">${note}</small>` : ''}
            </button>`;
        });
        panel.innerHTML += `<button class="target-btn" style="border-style:dashed;" onclick="selectNightTarget('guardiaTarget', null, this)">Nessuna sorveglianza</button>`;
    } else if (step.id === 'assassino') {
        if (gameState.history.assassinoBlocked) {
            panel.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:15px; color:#ff5555; background:#1b1515; border-radius:8px;">
                ⚠️ L'Assassino ha fallito l'indovinello la notte scorsa: stanotte il suo turno è <strong>BLOCCATO</strong>!
            </div>`;
        } else {
            living.forEach(p => {
                panel.innerHTML += `<button class="target-btn" onclick="selectAssassinoTarget('${p.id}', this)">${p.name}</button>`;
            });
            panel.innerHTML += `<button class="target-btn" style="border-style:dashed; grid-column:1/-1;" onclick="skipAssassino(this)">Non agisce stanotte</button>`;
            
            const activeRolesInGame = rolesDB.filter(r => gameState.selectedRoles[r.id] > 0);
            panel.innerHTML += `
                <div id="assassino-guess-container" style="grid-column: 1/-1; display:none; margin-top:10px; border-top:1px solid var(--gold-dark); padding-top:10px;">
                    <p style="font-size:0.85rem; color:var(--gold); margin-bottom:6px; text-align:center;">Seleziona il ruolo che l'Assassino dichiara:</p>
                    <div class="assassino-grid">
                        ${activeRolesInGame.map(r => `
                            <button class="assassino-role-btn" onclick="selectAssassinoGuess('${r.id}', this)">
                                ${r.icon} ${r.name}
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    } else if (step.id === 'lupi') {
        const nonWolvesLiving = living.filter(p => !p.isWolf);
        nonWolvesLiving.forEach(p => {
            panel.innerHTML += `<button class="target-btn" onclick="selectNightTarget('wolvesTarget', '${p.id}', this)">${p.name}</button>`;
        });
        panel.innerHTML += `<button class="target-btn" style="border-style:dashed;" onclick="selectNightTarget('wolvesTarget', null, this)">Nessun attacco</button>`;
    } else if (step.id === 'lupo_alpha') {
        const maxKills = gameState.players.length <= 10 ? 1 : 2;
        const remainingKills = maxKills - gameState.history.alphaKillsUsed;

        if (remainingKills <= 0) {
            panel.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:15px; color:#aaa; background:#171b26; border-radius:8px;">
                🐺👑 Il Lupo Alpha ha esaurito i suoi colpi autonomi per questa partita (0/${maxKills}).
            </div>`;
        } else {
            const nonWolvesLiving = living.filter(p => !p.isWolf);
            nonWolvesLiving.forEach(p => {
                panel.innerHTML += `<button class="target-btn" onclick="selectNightTarget('alphaWolfTarget', '${p.id}', this)">${p.name}</button>`;
            });
            panel.innerHTML += `<button class="target-btn" style="border-style:dashed;" onclick="selectNightTarget('alphaWolfTarget', null, this)">Non usare la kill extra</button>`;
            panel.innerHTML += `<div style="grid-column: 1/-1; text-align:center; font-size:0.8rem; color:var(--gold); margin-top:8px;">Colpi extra rimasti: ${remainingKills}/${maxKills}</div>`;
        }
    } else if (step.id === 'cieco') {
        if (gameState.history.ciecoUses >= 3) {
            panel.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:15px; color:#aaa; background:#171b26; border-radius:8px;">
                👁️ Il Cieco ha esaurito i suoi 3 usi disponibili.
            </div>`;
        } else {
            living.forEach(p => {
                panel.innerHTML += `<button class="target-btn" onclick="selectCiecoPair('${p.id}', this)">${p.name}</button>`;
            });
            panel.innerHTML += `<div style="grid-column: 1/-1; text-align:center; font-size:0.8rem; color:var(--gold);">Usi rimasti: ${3 - gameState.history.ciecoUses}/3</div>`;
        }
    } else if (step.id === 'monaca') {
        if (gameState.history.monacaUses >= 2) {
            panel.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:15px; color:#aaa; background:#171b26; border-radius:8px;">
                🙏 La Monaca Silente ha esaurito i suoi 2 usi disponibili.
            </div>`;
        } else {
            living.forEach(p => {
                panel.innerHTML += `<button class="target-btn" onclick="selectNightTarget('monacaTarget', '${p.id}', this)">${p.name}</button>`;
            });
            panel.innerHTML += `<button class="target-btn" style="border-style:dashed;" onclick="selectNightTarget('monacaTarget', null, this)">Non protegge nessuno</button>`;
            panel.innerHTML += `<div style="grid-column: 1/-1; text-align:center; font-size:0.8rem; color:var(--gold);">Usi rimasti: ${2 - gameState.history.monacaUses}/2</div>`;
        }
    } else if (step.id === 'veggente') {
        living.forEach(p => {
            panel.innerHTML += `<button class="target-btn" onclick="revealVeggenteLive('${p.id}', this)">${p.name}</button>`;
        });
    } else if (step.id === 'medium') {
        if (dead.length === 0) {
            panel.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:#777;">Nessun defunto da interrogare.</p>`;
        } else {
            dead.forEach(p => {
                panel.innerHTML += `<button class="target-btn" onclick="revealMediumGuide('${p.id}', this)">${p.name}</button>`;
            });
        }
    } else if (step.id === 'guardia_feedback') {
        const saved = checkGuardiaSuccess();
        panel.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:16px; background:#1b2030; border-radius:8px; border:1px solid ${saved ? '#44ff44' : '#444'};">
            Esito per la Guardia: <br>
            <strong style="color:${saved ? '#44ff44' : '#ff5555'}; font-size:1.15rem;">
                ${saved ? `✅ HA SALVATO ${saved.targetName}!<br><span style="font-size:0.95rem; color:#fff;">L'attacco proveniva dal giocatore: <span style="color:var(--gold);">${saved.attackerName}</span></span>` : '❌ Nessun attacco intercettato.'}
            </strong>
        </div>`;
    }
}

function selectNightTarget(key, val, btn) {
    document.querySelectorAll('.target-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    gameState.nightActions[key] = val;

    if (key === 'wolvesTarget' && val) {
        const target = gameState.roster.find(p => p.id === val);
        const isProt = (val === gameState.nightActions.damaTarget || val === gameState.nightActions.guardiaTarget);
        if (target && target.role.id === 'licantropo' && !isProt) {
            target.isWolf = true;
        }
    }
}

function selectAssassinoTarget(playerId, btn) {
    document.querySelectorAll('.target-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    gameState.nightActions.assassinoTarget = playerId;
    document.getElementById('assassino-guess-container').style.display = 'block';
}

function skipAssassino(btn) {
    document.querySelectorAll('.target-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    gameState.nightActions.assassinoTarget = null;
    gameState.nightActions.assassinoRoleGuess = null;
    document.getElementById('assassino-guess-container').style.display = 'none';
}

function selectAssassinoGuess(roleId, btn) {
    document.querySelectorAll('.assassino-role-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    gameState.nightActions.assassinoRoleGuess = roleId;
}

function selectCiecoPair(playerId, btn) {
    btn.classList.toggle('selected');
    let idx = gameState.nightActions.ciecoChoice.indexOf(playerId);
    if (idx > -1) gameState.nightActions.ciecoChoice.splice(idx, 1);
    else if (gameState.nightActions.ciecoChoice.length < 2) gameState.nightActions.ciecoChoice.push(playerId);
    
    if (gameState.nightActions.ciecoChoice.length === 2) {
        const p1 = gameState.roster.find(p => p.id === gameState.nightActions.ciecoChoice[0]);
        const p2 = gameState.roster.find(p => p.id === gameState.nightActions.ciecoChoice[1]);
        const same = p1.role.faction === p2.role.faction;
        alert(`Risposta da comunicare al Cieco:\n\n${same ? '👍 STESSA FAZIONE' : '👎 FAZIONI DIVERSE'}`);
        gameState.history.ciecoUses++;
    }
}

function revealVeggenteLive(playerId, btn) {
    document.querySelectorAll('.target-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    const p = gameState.roster.find(pl => pl.id === playerId);
    alert(`Risposta per il Veggente su ${p.name}:\n\n${p.isWolf ? '🐺 È UN LUPO!' : '🌾 NON È UN LUPO'}`);
}

function revealMediumGuide(playerId, btn) {
    document.querySelectorAll('.target-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    const p = gameState.roster.find(pl => pl.id === playerId);
    
    let cat = '✋ ALTRO (Villico o ruolo speciale)';
    let gesture = '1 DITO';
    if (p.isWolf) { cat = '🐺 LUPO'; gesture = '2 DITA'; }
    if (p.role.id === 'assassino') { cat = '🔪 ASSASSINO'; gesture = '3 DITA'; }

    alert(`Responso Medium su ${p.name}:\n\nCategoria: ${cat}\n\nGesto silenzioso da fare al Medium: ${gesture}`);
}

function checkGuardiaSuccess() {
    if (!gameState.nightActions.guardiaTarget) return null;
    const target = gameState.roster.find(p => p.id === gameState.nightActions.guardiaTarget);

    if (gameState.nightActions.wolvesTarget === target.id) {
        const aWolf = gameState.roster.filter(p => p.isWolf && p.isAlive).sort(() => Math.random() - 0.5)[0];
        return { targetName: target.name, attackerName: aWolf ? aWolf.name : 'Sconosciuto' };
    }
    if (gameState.nightActions.alphaWolfTarget === target.id) {
        const alpha = gameState.roster.find(p => p.role.id === 'lupo_alpha');
        return { targetName: target.name, attackerName: alpha ? alpha.name : 'Sconosciuto' };
    }
    if (gameState.nightActions.assassinoTarget === target.id && gameState.nightActions.assassinoRoleGuess === target.role.id) {
        const assassin = gameState.roster.find(p => p.role.id === 'assassino');
        return { targetName: target.name, attackerName: assassin ? assassin.name : 'Sconosciuto' };
    }
    return null;
}

function submitNightStep() {
    const step = gameState.nightSteps[gameState.currentStepIdx];
    
    if (step.id === 'dama') {
        gameState.history.lastDamaTarget = gameState.nightActions.damaTarget;
    }
    if (step.id === 'guardia') {
        gameState.history.lastGuardiaTarget = gameState.nightActions.guardiaTarget;
    }
    if (step.id === 'lupo_alpha' && gameState.nightActions.alphaWolfTarget) {
        gameState.history.alphaKillsUsed++;
    }
    if (step.id === 'monaca' && gameState.nightActions.monacaTarget) {
        gameState.history.monacaUses++;
    }

    gameState.currentStepIdx++;
    if (gameState.currentStepIdx < gameState.nightSteps.length) {
        renderNightStep();
    } else {
        resolveNightOutcomes();
    }
}

// ==========================================
// 7. CALCOLO ESITI NOTTE & ALBA
// ==========================================
function resolveNightOutcomes() {
    let deathsThisNight = [];
    let transformedLycan = false;
    let plagueTriggered = false;

    const wolfTarget = gameState.roster.find(p => p.id === gameState.nightActions.wolvesTarget);
    const alphaTarget = gameState.roster.find(p => p.id === gameState.nightActions.alphaWolfTarget);
    const damaProt = gameState.nightActions.damaTarget;
    const guardiaProt = gameState.nightActions.guardiaTarget;
    const amantiShelterId = gameState.nightActions.amantiShelter;

    function handleWolfAttack(target) {
        if (!target) return;
        const isProtected = (target.id === damaProt || target.id === guardiaProt);
        
        if (target.role.id === 'amanti') {
            if (target.id === amantiShelterId) {
                if (!isProtected) {
                    gameState.roster.filter(p => p.role.id === 'amanti' && p.isAlive).forEach(am => {
                        if (!deathsThisNight.some(d => d.player.id === am.id)) deathsThisNight.push({ player: am, reason: 'wolves' });
                    });
                }
            }
        } else if (target.role.id === 'licantropo') {
            if (!isProtected) {
                target.isWolf = true;
                transformedLycan = true;
            }
        } else {
            if (!isProtected && !deathsThisNight.some(d => d.player.id === target.id)) {
                deathsThisNight.push({ player: target, reason: 'wolves' });
                if (target.role.id === 'appestato') {
                    plagueTriggered = true;
                    const randomWolf = gameState.roster.filter(p => p.isWolf && p.isAlive && p.id !== target.id).sort(() => Math.random() - 0.5)[0];
                    if (randomWolf && !deathsThisNight.some(d => d.player.id === randomWolf.id)) {
                        deathsThisNight.push({ player: randomWolf, reason: 'plague' });
                    }
                }
            }
        }
    }

    handleWolfAttack(wolfTarget);
    handleWolfAttack(alphaTarget);

    if (gameState.nightActions.assassinoTarget && !gameState.history.assassinoBlocked) {
        const aTarget = gameState.roster.find(p => p.id === gameState.nightActions.assassinoTarget);
        const guess = gameState.nightActions.assassinoRoleGuess;
        const isProtected = (aTarget.id === damaProt || aTarget.id === guardiaProt);

        // Se l'Assassino indovina la professione...
        if (aTarget.role.id === guess) {
            
            // Ha indovinato! Quindi NON viene bloccato la notte successiva.
            gameState.history.assassinoBlocked = false;
            
            let inHome = true;
            if (aTarget.role.id === 'amanti' && aTarget.id !== amantiShelterId) inHome = false;

            if (inHome) {
                // Prende il punto solo se la vittima non è stata protetta
                if (!isProtected) {
                    gameState.history.assassinoKills++;
                    if (!deathsThisNight.some(d => d.player.id === aTarget.id)) {
                        deathsThisNight.push({ player: aTarget, reason: 'assassin' });
                        // Logica appestato in caso di kill dell'assassino
                        if (aTarget.role.id === 'appestato') {
                            plagueTriggered = true;
                            const assassinPlayer = gameState.roster.find(p => p.role.id === 'assassino');
                            if (assassinPlayer && !deathsThisNight.some(d => d.player.id === assassinPlayer.id)) {
                                deathsThisNight.push({ player: assassinPlayer, reason: 'plague' });
                            }
                        }
                    }
                }
            }
        } else {
            // Non ha indovinato! Niente punto, niente kill, e viene BLOCCATO.
            gameState.history.assassinoBlocked = true;
        }
    } else {
        gameState.history.assassinoBlocked = false;
    }

    if (gameState.nightNumber === 3) {
        const appestato = gameState.roster.find(p => p.role.id === 'appestato' && p.isAlive);
        if (appestato && !deathsThisNight.some(d => d.player.id === appestato.id)) {
            deathsThisNight.push({ player: appestato, reason: 'sickness' });
        }
    }

    deathsThisNight.forEach(d => d.player.isAlive = false);

    buildDawnScreen(deathsThisNight, transformedLycan, plagueTriggered);
    updateNarratorHUD();
}

function buildDawnScreen(deaths, transformedLycan, plagueTriggered) {
    switchScreen('screen-dawn');
    document.getElementById('bar-phase-text').innerText = `ALBA ${gameState.nightNumber}`;
    const prose = document.getElementById('dawn-story-text');
    const summary = document.getElementById('dawn-summary-box');

    let text = '';
    if (deaths.length === 0) {
        text = getUniqueNarration('dawnPeace');
    } else if (deaths.length === 1) {
        let template = getUniqueNarration('dawnSingleDeath');
        text = template.replace('{DEAD}', `<strong>${deaths[0].player.name}</strong>`);
    } else {
        const deadNames = deaths.map(d => `<strong>${d.player.name}</strong>`).join(' e ');
        let template = getUniqueNarration('dawnMultiDeath');
        text = template.replace('{DEAD}', deadNames);
    }

    if (plagueTriggered) {
        text += `<br><br><span style="color:#ff5555;">☣️ ${NARRATION_MASTER_LIB.dawnPlague[0]}</span>`;
    }
    if (transformedLycan) {
        text += `<br><br><span style="color:#ffaa00;">🌕 ${NARRATION_MASTER_LIB.dawnLycan[0]}</span>`;
    }

    prose.innerHTML = `"${text}"`;
    summary.innerHTML = deaths.length === 0 
        ? `<strong style="color:#44ff44;">Nessun morto stanotte.</strong>` 
        : `Decessi confermati: <strong style="color:#ff5555;">${deaths.map(d => d.player.name).join(', ')}</strong>`;

    checkVictoryConditions();
}

// ==========================================
// 8. GIORNO, VOTI, CENSURATORE & REFERENDUM
// ==========================================
function startDayDiscussion() {
    switchScreen('screen-day');
    document.getElementById('bar-phase-text').innerText = `GIORNO ${gameState.nightNumber} (TRIBUNALE)`;
    gameState.abstentions = 0;
    gameState.votesMap = {};
    gameState.referendum.active = false;
    document.getElementById('abstain-count').innerText = '0';

    document.getElementById('standard-voting-view').classList.remove('hidden');
    document.getElementById('referendum-view').classList.add('hidden');
    document.getElementById('day-screen-title').innerText = 'Il Tribunale del Villaggio 🔥';
    document.getElementById('day-screen-subtitle').innerText = 'Assegna i voti espressi dai vivi o registra le astensioni';

    const hasCensore = gameState.roster.some(p => p.role.id === 'censuratore' && p.isAlive);
    const censoreBox = document.getElementById('censore-action-box');
    if (hasCensore) censoreBox.classList.remove('hidden');
    else censoreBox.classList.add('hidden');

    renderVotingGrid();
    updateNarratorHUD();
}

function renderVotingGrid() {
    const grid = document.getElementById('voting-grid');
    grid.innerHTML = '';
    const living = gameState.roster.filter(p => p.isAlive);

    living.forEach(p => {
        gameState.votesMap[p.id] = 0;
        grid.innerHTML += `
            <div class="vote-row">
                <span><strong>${p.name}</strong></span>
                <div class="counter-pill">
                    <button onclick="changeVote('${p.id}', -1)">-</button>
                    <span id="vote-${p.id}">0</span>
                    <button onclick="changeVote('${p.id}', 1)">+</button>
                </div>
            </div>
        `;
    });
}

function changeAbstain(delta) {
    gameState.abstentions += delta;
    if (gameState.abstentions < 0) gameState.abstentions = 0;
    document.getElementById('abstain-count').innerText = gameState.abstentions;
}

function changeVote(playerId, delta) {
    gameState.votesMap[playerId] = (gameState.votesMap[playerId] || 0) + delta;
    if (gameState.votesMap[playerId] < 0) gameState.votesMap[playerId] = 0;
    document.getElementById(`vote-${playerId}`).innerText = gameState.votesMap[playerId];
}

function openCensoreModal() {
    const living = gameState.roster.filter(p => p.isAlive);
    let options = living.map(p => {
        const isBlocked = (p.id === gameState.history.lastCensuredTarget);
        return `${p.name} (Voti attuali: ${gameState.votesMap[p.id] || 0})${isBlocked ? ' [BLOCCATO]' : ''}`;
    }).join('\n- ');

    const choice = prompt(`Tutti chiudono gli occhi. Chiedi al Censuratore a chi togliere 1 voto:\n\n- ${options}\n\nDigita il NOME esatto del giocatore da censurare (oppure lascia vuoto per non agire):`);
    
    if (choice) {
        const target = living.find(p => p.name.toLowerCase() === choice.trim().toLowerCase());
        if (target) {
            if (target.id === gameState.history.lastCensuredTarget) {
                alert('Non puoi censurare la stessa persona per due turni consecutivi!');
                return;
            }
            if ((gameState.votesMap[target.id] || 0) > 0) {
                gameState.votesMap[target.id]--;
                document.getElementById(`vote-${target.id}`).innerText = gameState.votesMap[target.id];
                gameState.history.lastCensuredTarget = target.id;
                alert(`Voto annullato! I voti di ${target.name} scendono a ${gameState.votesMap[target.id]}.`);
            } else {
                alert(`${target.name} non aveva voti da togliere.`);
            }
        } else {
            alert('Nome non trovato.');
        }
    }
}

function processDayVotes() {
    const living = gameState.roster.filter(p => p.isAlive);
    let maxVotes = -1;
    let topPlayers = [];

    living.forEach(p => {
        let v = gameState.votesMap[p.id] || 0;
        if (v > maxVotes) {
            maxVotes = v;
            topPlayers = [p];
        } else if (v === maxVotes && maxVotes > 0) {
            topPlayers.push(p);
        }
    });

    if (maxVotes === 0) {
        alert(getUniqueNarration('rogoReprieve'));
        endDayPhase();
        return;
    }

    if (gameState.abstentions > maxVotes) {
        alert(`Gli astenuti (${gameState.abstentions}) superano i voti sul sospettato (${maxVotes}). Nessuno viene mandato al rogo!`);
        endDayPhase();
        return;
    }

    if (topPlayers.length === 1 && maxVotes === gameState.abstentions) {
        startReferendumCondemn(topPlayers[0]);
        return;
    }

    if (topPlayers.length > 1) {
        startReferendumTie(topPlayers);
        return;
    }

    condemnToRogo(topPlayers[0]);
}

function startReferendumTie(candidates) {
    gameState.referendum.active = true;
    gameState.referendum.type = 'tie';
    gameState.referendum.candidates = candidates;
    gameState.referendum.votes = {};

    document.getElementById('standard-voting-view').classList.add('hidden');
    document.getElementById('referendum-view').classList.remove('hidden');

    document.getElementById('day-screen-title').innerText = '⚖️ REFERENDUM DI SPAREGGIO';
    document.getElementById('day-screen-subtitle').innerText = 'I candidati non votano. Il villaggio deve scegliere chi eliminare!';

    const candNames = candidates.map(c => c.name).join(' e ');
    let intro = getUniqueNarration('referendumTieIntro');
    document.getElementById('referendum-intro-text').innerHTML = `"${intro.replace('{CANDIDATES}', `<strong>${candNames}</strong>`)}"`;

    const grid = document.getElementById('referendum-voting-grid');
    grid.innerHTML = '';
    candidates.forEach(c => {
        gameState.referendum.votes[c.id] = 0;
        grid.innerHTML += `
            <div class="vote-row">
                <span>Manda al rogo <strong>${c.name}</strong></span>
                <div class="counter-pill">
                    <button onclick="changeReferendumVote('${c.id}', -1)">-</button>
                    <span id="ref-vote-${c.id}">0</span>
                    <button onclick="changeReferendumVote('${c.id}', 1)">+</button>
                </div>
            </div>
        `;
    });
}

function startReferendumCondemn(accused) {
    gameState.referendum.active = true;
    gameState.referendum.type = 'condemn';
    gameState.referendum.candidates = [accused];
    gameState.referendum.votes = { 'burn': 0, 'save': 0 };

    document.getElementById('standard-voting-view').classList.add('hidden');
    document.getElementById('referendum-view').classList.remove('hidden');

    document.getElementById('day-screen-title').innerText = '⚖️ REFERENDUM DI CONDANNA';
    document.getElementById('day-screen-subtitle').innerText = `${accused.name} non vota. Il villaggio decide tra ELIMINARE o GRAZIARE.`;

    let intro = getUniqueNarration('referendumCondemnIntro');
    document.getElementById('referendum-intro-text').innerHTML = `"${intro.replace('{NAME}', `<strong>${accused.name}</strong>`)}"`;

    const grid = document.getElementById('referendum-voting-grid');
    grid.innerHTML = `
        <div class="vote-row">
            <span>🔥 <strong>ELIMINA ${accused.name}</strong></span>
            <div class="counter-pill">
                <button onclick="changeReferendumVote('burn', -1)">-</button>
                <span id="ref-vote-burn">0</span>
                <button onclick="changeReferendumVote('burn', 1)">+</button>
            </div>
        </div>
        <div class="vote-row">
            <span>🕊️ <strong>GRAZIA (Nessuna Morte)</strong></span>
            <div class="counter-pill">
                <button onclick="changeReferendumVote('save', -1)">-</button>
                <span id="ref-vote-save">0</span>
                <button onclick="changeReferendumVote('save', 1)">+</button>
            </div>
        </div>
    `;
}

function changeReferendumVote(key, delta) {
    gameState.referendum.votes[key] = (gameState.referendum.votes[key] || 0) + delta;
    if (gameState.referendum.votes[key] < 0) gameState.referendum.votes[key] = 0;
    document.getElementById(`ref-vote-${key}`).innerText = gameState.referendum.votes[key];
}

function processReferendumVotes() {
    if (gameState.referendum.type === 'tie') {
        let maxV = -1;
        let winners = [];
        gameState.referendum.candidates.forEach(c => {
            let v = gameState.referendum.votes[c.id] || 0;
            if (v > maxV) { maxV = v; winners = [c]; }
            else if (v === maxV && maxV > 0) { winners.push(c); }
        });

        if (maxV === 0 || winners.length > 1) {
            alert('Anche il Referendum è finito in parità! Nessun rogo viene eseguito oggi.');
            endDayPhase();
        } else {
            condemnToRogo(winners[0]);
        }
    } else if (gameState.referendum.type === 'condemn') {
        const burnVotes = gameState.referendum.votes['burn'] || 0;
        const saveVotes = gameState.referendum.votes['save'] || 0;
        const accused = gameState.referendum.candidates[0];

        if (burnVotes > saveVotes) {
            condemnToRogo(accused);
        } else {
            alert(`Il villaggio ha scelto di graziare ${accused.name}! Nessuna morte sul rogo.`);
            endDayPhase();
        }
    }
}

function condemnToRogo(condemned) {
    if (condemned.id === gameState.nightActions.monacaTarget) {
        alert(`Il villaggio ha votato ${condemned.name}, ma le preghiere della Monaca Silente lo salvano dal rogo! Nessuna morte.`);
        endDayPhase();
        return;
    }

    condemned.isAlive = false;
    let template = getUniqueNarration('rogoCondemn');
    alert(template.replace('{NAME}', condemned.name));

    if (condemned.role.id === 'pazzo') {
        showVictory('pazzo', `Il Pazzo (${condemned.name}) è riuscito a farsi bruciare sul Rogo! Vince la partita da solo all'istante!`);
        return;
    }

    updateNarratorHUD();
    endDayPhase();
}

function endDayPhase() {
    if (checkVictoryConditions()) return;
    gameState.nightNumber++;
    showDuskTransition();
}

// ==========================================
// 9. VITTORIA MAESTOSA
// ==========================================
function checkVictoryConditions() {
    const living = gameState.roster.filter(p => p.isAlive);
    const wolvesLiving = living.filter(p => p.isWolf).length;
    const assassinLiving = living.some(p => p.role.id === 'assassino');

    // FIX MATEMATICA ASSASSINO: 6-8->2, 9-12->3, 13+->4
    let requiredKills = 2;
    if (gameState.players.length >= 9 && gameState.players.length <= 12) requiredKills = 3;
    if (gameState.players.length >= 13) requiredKills = 4;
    
    if (gameState.history.assassinoKills >= requiredKills && assassinLiving) {
        showVictory('assassino', `L'Assassino ha raggiunto ${requiredKills} eliminazioni perfette nell'ombra! Trionfa da solo.`);
        return true;
    }

    if (wolvesLiving >= (living.length - wolvesLiving) && !assassinLiving) {
        showVictory('lupi', 'I Lupi eguagliano o superano i Villici superstiti. Le tenebre avvolgono per sempre il villaggio!');
        return true;
    }

    if (wolvesLiving === 0 && !assassinLiving) {
        showVictory('villici', 'Tutte le bestie e le minacce sono state sterminate. I Villici possono finalmente vivere in pace!');
        return true;
    }

    return false;
}

function showVictory(faction, storyText) {
    switchScreen('screen-victory');
    document.getElementById('narrator-control-bar').classList.add('hidden');
    document.getElementById('narrator-hud').classList.remove('open');
    document.getElementById('mobile-hud-btn').classList.add('hidden');
    toggleMobileHUD(false);

    const title = document.getElementById('victory-title');
    const icon = document.getElementById('victory-icon');
    const desc = document.getElementById('victory-story');
    const frame = document.getElementById('victory-icon-frame');

    if (faction === 'lupi') {
        title.innerText = 'I LUPI TRIONFANO!';
        icon.innerText = '🐺';
        frame.style.boxShadow = '0 0 35px rgba(200, 0, 0, 0.6)';
    } else if (faction === 'assassino') {
        title.innerText = 'L\'ASSASSINO HA VINTO!';
        icon.innerText = '🔪';
        frame.style.boxShadow = '0 0 35px rgba(120, 50, 200, 0.6)';
    } else if (faction === 'pazzo') {
        title.innerText = 'IL PAZZO TRIONFA!';
        icon.innerText = '🤪';
        frame.style.boxShadow = '0 0 35px rgba(255, 180, 0, 0.6)';
    } else {
        title.innerText = 'I VILLICI HANNO VINTO!';
        icon.innerText = '🌾';
        frame.style.boxShadow = '0 0 35px rgba(50, 180, 50, 0.6)';
    }

    desc.innerHTML = `"${storyText}"`;
    updateNarratorHUD();
}

// ==========================================
// 10. MODALE REGIA & INTERRUZIONE
// ==========================================
function openEmergencyModal() {
    document.getElementById('emergency-modal').classList.remove('hidden');
}

function closeEmergencyModal() {
    document.getElementById('emergency-modal').classList.add('hidden');
}

function forceVictory(faction) {
    closeEmergencyModal();
    showVictory(faction, "Vittoria decretata manualmente dal Narratore di gioco.");
}

function abortGameConfirm() {
    if (confirm("Sei sicuro di voler interrompere la partita attuale e tornare alla schermata di preparazione?")) {
        closeEmergencyModal();
        document.getElementById('narrator-control-bar').classList.add('hidden');
        document.getElementById('narrator-hud').classList.remove('open');
        document.getElementById('mobile-hud-btn').classList.add('hidden');
        toggleMobileHUD(false);
        switchScreen('screen-setup');
    }
}

// ==========================================
// 11. HUD NARRATORE (TRACKER ASSASSINO & SWIPE REALE)
// ==========================================
function updateNarratorHUD() {
    const list = document.getElementById('hud-roster-list');
    const aliveCount = document.getElementById('hud-alive-count');
    const wolvesCount = document.getElementById('hud-wolves-count');
    const assassinTrackerBox = document.getElementById('hud-assassin-tracker');
    const assassinPips = document.getElementById('assassin-tracker-pips');

    if (!gameState.roster || gameState.roster.length === 0) return;

    const living = gameState.roster.filter(p => p.isAlive);
    const wolves = living.filter(p => p.isWolf);

    aliveCount.innerText = living.length;
    wolvesCount.innerText = wolves.length;

    // Gestione Tracker Assassino nel Registro
    const hasAssassin = gameState.roster.some(p => p.role.id === 'assassino');
    if (hasAssassin) {
        assassinTrackerBox.classList.remove('hidden');
        
        let requiredKills = 2;
        if (gameState.players.length >= 9 && gameState.players.length <= 12) requiredKills = 3;
        if (gameState.players.length >= 13) requiredKills = 4;
        
        let pipsStr = '';
        for (let i = 0; i < requiredKills; i++) {
            pipsStr += (i < gameState.history.assassinoKills) ? '🟢' : '⚪';
        }
        assassinPips.innerHTML = `${pipsStr} <small style="color:#aaa;">(${gameState.history.assassinoKills}/${requiredKills})</small>`;
    } else {
        assassinTrackerBox.classList.add('hidden');
    }

    const sortedRoster = [...gameState.roster].sort((a, b) => {
        let indexA = HUD_ROLE_ORDER.indexOf(a.role.id);
        let indexB = HUD_ROLE_ORDER.indexOf(b.role.id);
        if (indexA === -1) indexA = 99;
        if (indexB === -1) indexB = 99;
        return indexA - indexB;
    });

    list.innerHTML = sortedRoster.map(p => `
        <div class="hud-row ${p.isAlive ? '' : 'dead'}">
            <span><strong>${p.name}</strong> ${p.isWolf && p.isAlive ? '🐺' : ''}</span>
            <span>${p.role.name} ${p.role.icon}</span>
        </div>
    `).join('');
}

function toggleMobileHUD(forceState) {
    const hud = document.getElementById('narrator-hud');
    const backdrop = document.getElementById('hud-backdrop');

    if (forceState !== undefined) {
        if (forceState) {
            hud.classList.add('open');
            hud.style.transform = ''; 
            backdrop.classList.remove('hidden');
        } else {
            hud.classList.remove('open');
            hud.style.transform = ''; 
            backdrop.classList.add('hidden');
        }
    } else {
        hud.classList.toggle('open');
        hud.style.transform = ''; 
        backdrop.classList.toggle('hidden');
    }
}

// Swipe fluido per chiudere il cassetto senza muovere lo sfondo
function setupSwipeGesture() {
    const hud = document.getElementById('narrator-hud');
    let touchStartX = 0;
    let touchCurrentX = 0;

    hud.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
    }, { passive: true });

    hud.addEventListener('touchmove', (e) => {
        e.preventDefault(); 
        
        touchCurrentX = e.touches[0].clientX;
        let deltaX = touchCurrentX - touchStartX;
        
        if (deltaX > 0) {
            hud.style.transform = `translateX(${deltaX}px)`;
        }
    }, { passive: false }); 

    hud.addEventListener('touchend', (e) => {
        let deltaX = touchCurrentX - touchStartX;
        if (deltaX > 60) {
            toggleMobileHUD(false);
        } else {
            hud.style.transform = '';
        }
        touchStartX = 0;
        touchCurrentX = 0;
    }, { passive: true });
}

function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    window.scrollTo(0, 0);
}

// Avvio
initApp();