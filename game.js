class DavinciCodeGame {
    constructor() {
        this.whiteDeck = ['0w', '1w', '2w', '3w', '4w', '5w', '6w', '7w', '8w', '9w', 'a0w', 'a1w'];
        this.blackDeck = ['0b', '1b', '2b', '3b', '4b', '5b', '6b', '7b', '8b', '9b', 'a0b', 'a1b'];
        this.fixedList = [...this.whiteDeck, ...this.blackDeck, '-w', '-b'];
        
        this.myDeck = [];
        this.userDeck = [];
        this.revealedDeck = [];
        this.userRevealedDeck = [];
        this.correctedCard = [];
        this.triedChoices = [];
        
        this.numBlack = 2;
        this.numWhite = 2;
        this.turn = 1;
        this.botFlag = true;
        this.userFlag = true;
        this.turnFirst = true;
        this.isThereJoker = false;
        this.cntNoJoker = 1;
        this.pendingJoker = null;
        this.selectedCardIndex = null;
        this.lastBotCardIndex = null;
        this.lastUserCardIndex = null;
        this.hasGuessedThisTurn = false;
        this.lastAddedCard = null; // 최근 AI가 이번 턴에 뽑은 카드 정보를 보관
        this.playertriedcard = null; // 가장 최근 플레이어가 시도한 선택
    }

    initGame() {
        const whiteForUser = this.getRandomCards(this.whiteDeck, 2);
        const blackForUser = this.getRandomCards(this.blackDeck, 2);
        this.userDeck = [...whiteForUser, ...blackForUser].sort();

        const remainingWhite = this.whiteDeck.filter(c => !whiteForUser.includes(c));
        const remainingBlack = this.blackDeck.filter(c => !blackForUser.includes(c));
        
        const whiteForBot = this.getRandomCards(remainingWhite, 2);
        const blackForBot = this.getRandomCards(remainingBlack, 2);
        this.myDeck = [...whiteForBot, ...blackForBot].sort();

        this.revealedDeck = Array(4).fill('_');
        this.userRevealedDeck = Array(4).fill('_');
        this.deleteOverlap();

        this.whiteDeck.push('-w');
        this.blackDeck.push('-b');
        
        this.turn = 1;
        this.correctedCard = [];
        this.triedChoices = [];
        this.turnFirst = true;
        this.userFlag = true;
        this.botFlag = true;
        this.lastBotCardIndex = null;
        this.lastUserCardIndex = null;
        this.hasGuessedThisTurn = false;
        this.isThereJoker = false;
        this.playertriedcard = null;
    }

    getRandomCards(deck, count) {
        const shuffled = [...deck].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    deleteOverlap() {
        this.whiteDeck = this.whiteDeck.filter(card => !this.myDeck.includes(card));
        this.blackDeck = this.blackDeck.filter(card => !this.myDeck.includes(card));
    }

    showDeckColor(deck) {
        return deck.map(card => card[card.length - 1]);
    }

    userAddCard() {
        let randomCard;
        do {
            const randomInt = Math.floor(Math.random() * this.fixedList.length);
            randomCard = this.fixedList[randomInt];
        } while (this.userDeck.includes(randomCard) || this.myDeck.includes(randomCard));

        if (randomCard[randomCard.length - 1] === 'w') {
            this.numWhite++;
        } else {
            this.numBlack++;
        }

        if (randomCard[0] === '-') {
            this.pendingJoker = randomCard;
            return { card: randomCard, needsPosition: true };
        } else {
            this.userDeck.push(randomCard);
            const wPos = this.userDeck.indexOf('-w');
            const bPos = this.userDeck.indexOf('-b');

            if (wPos !== -1 || bPos !== -1) {
                if (wPos !== -1) this.userDeck.splice(wPos, 1);
                if (bPos !== -1) this.userDeck.splice(this.userDeck.indexOf('-b'), 1);
                
                this.userDeck.sort();
                
                if (wPos !== -1) this.userDeck.splice(wPos, 0, '-w');
                if (bPos !== -1) this.userDeck.splice(bPos, 0, '-b');
            } else {
                this.userDeck.sort();
            }

            const cardIndex = this.userDeck.indexOf(randomCard);
            this.lastUserCardIndex = cardIndex;
            this.triedChoices = this.repositioning(this.triedChoices, cardIndex);

            const prevUserRevealedValues = (this.userRevealedDeck || []).filter(v => v !== '_');
            const prevRevealedValues = (this.revealedDeck || []).filter(v => v !== '_');

            const newUserRevealed = Array(this.userDeck.length).fill('_');
            const newRevealed = Array(this.userDeck.length).fill('_');

            for (let i = 0; i < this.userDeck.length; i++) {
                const c = this.userDeck[i];
                if (prevUserRevealedValues.includes(c) || prevRevealedValues.includes(c)) {
                    newUserRevealed[i] = c;
                    newRevealed[i] = c;
                }
            }

            this.userRevealedDeck = newUserRevealed;
            this.revealedDeck = newRevealed;

            return { card: randomCard, index: cardIndex, needsPosition: false };
        }
    }

    // 색상을 지정해서 플레이어가 카드를 뽑도록 하는 함수
    userAddCardWithColor(color) {
        // color는 'w' 또는 'b'
        let randomCard = null;
        const candidates = this.fixedList.filter(c => c.endsWith(color));

        // pick a random card from candidates that's not already in decks
        const available = candidates.filter(c => !this.userDeck.includes(c) && !this.myDeck.includes(c));
        if (available.length === 0) {
            // fallback: 기존 동작과 동일하게 아무 카드나 뽑음
            return this.userAddCard();
        }

        randomCard = available[Math.floor(Math.random() * available.length)];

        if (randomCard[randomCard.length - 1] === 'w') {
            this.numWhite++;
        } else {
            this.numBlack++;
        }

        if (randomCard[0] === '-') {
            this.pendingJoker = randomCard;
            return { card: randomCard, needsPosition: true };
        } else {
            this.userDeck.push(randomCard);
            const wPos = this.userDeck.indexOf('-w');
            const bPos = this.userDeck.indexOf('-b');

            if (wPos !== -1 || bPos !== -1) {
                if (wPos !== -1) this.userDeck.splice(wPos, 1);
                if (bPos !== -1) this.userDeck.splice(this.userDeck.indexOf('-b'), 1);

                this.userDeck.sort();

                if (wPos !== -1) this.userDeck.splice(wPos, 0, '-w');
                if (bPos !== -1) this.userDeck.splice(bPos, 0, '-b');
            } else {
                this.userDeck.sort();
            }

            const cardIndex = this.userDeck.indexOf(randomCard);
            this.lastUserCardIndex = cardIndex;
            this.triedChoices = this.repositioning(this.triedChoices, cardIndex);

            // 안전한 동기화: 이전에 공개되었던 카드 값을 보존하면서 새 배열을 생성
            const prevUserRevealedValues = (this.userRevealedDeck || []).filter(v => v !== '_');
            const prevRevealedValues = (this.revealedDeck || []).filter(v => v !== '_');

            const newUserRevealed = Array(this.userDeck.length).fill('_');
            const newRevealed = Array(this.userDeck.length).fill('_');

            for (let i = 0; i < this.userDeck.length; i++) {
                const c = this.userDeck[i];
                if (prevUserRevealedValues.includes(c) || prevRevealedValues.includes(c)) {
                    newUserRevealed[i] = c;
                    newRevealed[i] = c;
                }
            }

            this.userRevealedDeck = newUserRevealed;
            this.revealedDeck = newRevealed;

            return { card: randomCard, index: cardIndex, needsPosition: false };
        }
    }

    insertJokerToUserDeck(position) {
        const joker = this.pendingJoker;
        this.userDeck.splice(position, 0, joker);
        this.lastUserCardIndex = position;
        this.triedChoices = this.repositioning(this.triedChoices, position);

        const prevUserRevealedValues = (this.userRevealedDeck || []).filter(v => v !== '_');
        const prevRevealedValues = (this.revealedDeck || []).filter(v => v !== '_');

        const newUserRevealed = Array(this.userDeck.length).fill('_');
        const newRevealed = Array(this.userDeck.length).fill('_');

        for (let i = 0; i < this.userDeck.length; i++) {
            const c = this.userDeck[i];
            if (prevUserRevealedValues.includes(c) || prevRevealedValues.includes(c)) {
                newUserRevealed[i] = c;
                newRevealed[i] = c;
            }
        }

        this.userRevealedDeck = newUserRevealed;
        this.revealedDeck = newRevealed;

        this.pendingJoker = null;
        return { card: joker, index: position };
    }

    myAddCard() {
        let randomCard;
        do {
            const randomInt = Math.floor(Math.random() * this.fixedList.length);
            randomCard = this.fixedList[randomInt];
        } while (this.userDeck.includes(randomCard) || this.myDeck.includes(randomCard));

        if (randomCard[0] === '-') {
            const jokerPos = Math.floor(Math.random() * (this.myDeck.length + 1));
            this.myDeck.splice(jokerPos, 0, randomCard);
            this.lastBotCardIndex = jokerPos;
            return { card: randomCard, index: jokerPos };
        } else {
            this.myDeck.push(randomCard);
            const wPos = this.myDeck.indexOf('-w');
            const bPos = this.myDeck.indexOf('-b');

            if (wPos !== -1 || bPos !== -1) {
                if (wPos !== -1) this.myDeck.splice(wPos, 1);
                if (bPos !== -1) this.myDeck.splice(this.myDeck.indexOf('-b'), 1);
                
                this.myDeck.sort();
                
                if (wPos !== -1) this.myDeck.splice(wPos, 0, '-w');
                if (bPos !== -1) this.myDeck.splice(bPos, 0, '-b');
            } else {
                this.myDeck.sort();
            }

            const cardIndex = this.myDeck.indexOf(randomCard);
            this.lastBotCardIndex = cardIndex;
            return { card: randomCard, index: cardIndex };
        }
    }

    repositioning(choices, addedPosition) {
        return choices.map(([pos, card]) => {
            if (pos >= addedPosition) {
                return [pos + 1, card];
            }
            return [pos, card];
        });
    }

    revealRandomUserCard() {
        // Python 코드처럼: 최근에 뽑은 카드(added_card_info)를 우선 공개
        if (this.lastUserCardIndex !== null && this.userRevealedDeck[this.lastUserCardIndex] === '_') {
            const idx = this.lastUserCardIndex;
            this.userRevealedDeck[idx] = this.userDeck[idx];
            if (!this.revealedDeck) this.revealedDeck = [];
            this.revealedDeck[idx] = this.userDeck[idx];
            
            if (this.userDeck[idx] && this.userDeck[idx][0] === '-') {
                this.isThereJoker = true;
            }
            
            const result = { card: this.userDeck[idx], index: idx };
            this.lastUserCardIndex = null;
            return result;
        }

        const unrevealed = this.userDeck
            .map((card, index) => ({ card, index }))
            .filter(({ index }) => this.userRevealedDeck[index] === '_');

        if (unrevealed.length === 0) return null;

        const selectedCard = unrevealed[0];
        this.userRevealedDeck[selectedCard.index] = selectedCard.card;
        if (!this.revealedDeck) this.revealedDeck = [];
        this.revealedDeck[selectedCard.index] = selectedCard.card;
        
        if (selectedCard.card && selectedCard.card[0] === '-') {
            this.isThereJoker = true;
        }
        
        this.lastUserCardIndex = null;
        return selectedCard;
    }

    generatePossibleDeck() {
        const allDeck = [];
        const possibleBlack = this.combinations(this.blackDeck, this.numBlack);
        const possibleWhite = this.combinations(this.whiteDeck, this.numWhite);
        const userColor = this.showDeckColor(this.userDeck);
        this.cntNoJoker = 1;

        for (const blackCards of possibleBlack) {
            for (const whiteCards of possibleWhite) {
                const purpose = [...blackCards, ...whiteCards].sort();
                
                // Exclude cases that contain the player's last guessed card
                const playerGuess = this.playertriedcard; // may be null

                if (purpose[0] && purpose[0][0] === '-') {
                    const cases = this.generateAllCombinations(purpose);
                    for (const c of cases) {
                        if (playerGuess && c.includes(playerGuess)) continue;
                        allDeck.push(c);
                    }
                } else {
                    let flag = true;
                    for (let index = 0; index < purpose.length; index++) {
                        if (!purpose[index].includes(userColor[index])) {
                            flag = false;
                            break;
                        }
                    }
                    
                    if (flag) {
                        let isRevealed = true;
                        for (let k = 0; k < purpose.length; k++) {
                            const rev = (k < this.revealedDeck.length) ? this.revealedDeck[k] : '_';
                            if (rev !== '_' && purpose[k] !== rev) {
                                isRevealed = false;
                                break;
                            }
                        }
                        if (isRevealed) {
                            // skip if this possible deck contains the player's last guess
                            if (this.playertriedcard && purpose.includes(this.playertriedcard)) {
                                // excluded
                            } else {
                                allDeck.push(purpose);
                                this.cntNoJoker++;
                            }
                        }
                    }
                }
            }
        }

        return allDeck;
    }

    combinations(arr, k) {
        if (k === 0) return [[]];
        if (arr.length === 0) return [];
        
        const [first, ...rest] = arr;
        const withFirst = this.combinations(rest, k - 1).map(c => [first, ...c]);
        const withoutFirst = this.combinations(rest, k);
        
        return [...withFirst, ...withoutFirst];
    }

    permutations(arr) {
        if (arr.length <= 1) return [arr];
        
        const result = [];
        for (let i = 0; i < arr.length; i++) {
            const current = arr[i];
            const remaining = [...arr.slice(0, i), ...arr.slice(i + 1)];
            const perms = this.permutations(remaining);
            for (const perm of perms) {
                result.push([current, ...perm]);
            }
        }
        return result;
    }

    generateAllCombinations(lst) {
        const flags = lst.filter(x => typeof x === 'string' && x.startsWith('-'));
        const integers = lst.filter(x => !(typeof x === 'string' && x.startsWith('-'))).sort();
        const results = [];
        const userColor = this.showDeckColor(this.userDeck);

        for (const flagPerm of this.permutations(flags)) {
            this.generatePlacements(flagPerm, integers, [], 0, results, userColor);
        }

        return results;
    }

    generatePlacements(flags, integers, current, flagIdx, results, userColor) {
        if (flagIdx === flags.length) {
            const tempLst = [...current, ...integers];
            let flag = true;
            
            for (let i = 0; i < tempLst.length; i++) {
                if (!tempLst[i].includes(userColor[i])) {
                    flag = false;
                    break;
                }
            }
            
            if (flag) {
                let isRevealed = true;
                for (let k = 0; k < tempLst.length; k++) {
                    const rev = (k < this.revealedDeck.length) ? this.revealedDeck[k] : '_';
                    if (rev !== '_' && tempLst[k] !== rev) {
                        isRevealed = false;
                        break;
                    }
                }
                if (isRevealed) {
                    results.push(tempLst);
                }
            }
            return;
        }

        for (let i = 0; i <= integers.length; i++) {
            const newCurrent = [...current, ...integers.slice(0, i), flags[flagIdx]];
            const newIntegers = integers.slice(i);
            this.generatePlacements(flags, newIntegers, newCurrent, flagIdx + 1, results, userColor);
        }
    }

    findBestChoice(allDeck) {
        const remainingCards = [...this.whiteDeck, ...this.blackDeck];
        const choices = [];
        const lenAllDeck = allDeck.length;

        if (allDeck.length === 0 || allDeck[0].length === 0) {
            return { ifJoker: [], noJoker: [] };
        }

        for (let i = 0; i < allDeck[0].length; i++) {
            for (const card of remainingCards) {
                choices.push([i, card]);
            }
        }

        const result = [];
        for (const [pos, card] of choices) {
            // Python 코드처럼: 이미 공개된 위치는 카운트하지 않음
            if (this.revealedDeck[pos] !== '_' && this.revealedDeck[pos] === card) {
                continue;
            }
            
            let successRate = 0;
            let noJoker = 0;
            
            for (const tempDeck of allDeck) {
                if (tempDeck[pos] === card && this.revealedDeck[pos] !== card) {
                    successRate++;
                    if (!tempDeck.includes('-w') && !tempDeck.includes('-b')) {
                        noJoker++;
                    }
                }
            }
            
            result.push({
                choice: [pos, card],
                successRate: (successRate / lenAllDeck) * 100,
                noJokerRate: (noJoker / this.cntNoJoker) * 100
            });
        }

        const sortedBySuccess = [...result].sort((a, b) => b.successRate - a.successRate);
        const sortedByNoJoker = [...result].sort((a, b) => b.noJokerRate - a.noJokerRate);

        return { ifJoker: sortedBySuccess, noJoker: sortedByNoJoker };
    }

    botTurn() {
        const allDeck = this.generatePossibleDeck();
        const { ifJoker, noJoker } = this.findBestChoice(allDeck);
        
        const finalResult = this.isThereJoker ? ifJoker : noJoker;

        if (!this.turnFirst && (finalResult[0].successRate + finalResult[0].noJokerRate) / 2 <= 33.4) {
            return { action: 'pass', deckCount: allDeck.length };
        }

        let selectedChoice = null;
        for (const choice of finalResult) {
            const [pos, card] = choice.choice;
            const alreadyTried = this.triedChoices.some(([p, c]) => p === pos && c === card);
            
            if (alreadyTried || (choice.noJokerRate === 0 && choice.successRate < 80 && card[0] === '-')) {
                continue;
            }
            
            selectedChoice = choice;
            break;
        }

        if (!selectedChoice) {
            return { action: 'pass', deckCount: allDeck.length };
        }

        this.triedChoices.push(selectedChoice.choice);

        return {
            action: 'guess',
            position: selectedChoice.choice[0],
            card: selectedChoice.choice[1],
            successRate: selectedChoice.noJokerRate,
            deckCount: allDeck.length
        };
    }

    validateUserGuess(position, card) {
        if (this.myDeck[position] === card) {
            this.correctedCard.push(card);
            this.deleteOverlap();
            return true;
        }
        return false;
    }

    validateBotGuess(position, card) {
        if (this.userDeck[position] === card) {
            this.revealedDeck[position] = card;
            this.userRevealedDeck[position] = card;
            this.deleteOverlap();
            return true;
        }
        return false;
    }

    isGameOver() {
        return this.correctedCard.length === this.myDeck.length;
    }

    isPlayerGameOver() {
        // 더 견고한 판정:
        // - userRevealedDeck 길이가 userDeck 길이와 동일해야 함
        // - 모든 인덱스에서 값이 존재하고 '_'가 아니어야 게임 종료로 판단
        if (!Array.isArray(this.userRevealedDeck)) return false;
        if (this.userRevealedDeck.length !== this.userDeck.length) return false;
        for (let i = 0; i < this.userDeck.length; i++) {
            const val = this.userRevealedDeck[i];
            if (typeof val === 'undefined' || val === '_' || val === null) return false;
        }
        return true;
    }

    getDisplayBotDeck() {
        return this.myDeck.map(card => {
            if (this.correctedCard.includes(card)) {
                return card;
            }
            return card[card.length - 1];
        });
    }

    getAvailableNumbers() {
        const allCards = ['0w', '1w', '2w', '3w', '4w', '5w', '6w', '7w', '8w', '9w', 'a0w', 'a1w',
                         '0b', '1b', '2b', '3b', '4b', '5b', '6b', '7b', '8b', '9b', 'a0b', 'a1b',
                         '-w', '-b'];
        
        return allCards.filter(card => {
            if (this.userDeck.includes(card)) return false;
            if (this.correctedCard.includes(card)) return false;
            return true;
        });
    }
}

// 전역 변수
let game = null;
let waitingForNumber = false;

// 게임 초기화
function initGame() {
    game = new DavinciCodeGame();
    game.initGame();
    
    // 초기 상태 기준으로 턴 동기화
    syncTurnCount();

    // 플레이어가 뽑을 카드 색상을 선택하도록 모달 표시
    showColorChoiceModal(result => {
        if (!result) return;
        if (result.needsPosition) {
            showJokerPlacementModal();
        }
        // 플레이어가 카드를 뽑았으니 턴을 다시 동기화
        syncTurnCount();
        updateUI();
    });
    
    updateUI();
    updateTurnIndicator('카드를 뽑았습니다. 상대 카드를 예측하세요');
    showToast('게임이 시작되었습니다!', 'success');
    
    document.getElementById('passBtn').disabled = true;
    document.getElementById('testDeckBtn').disabled = false;
}

// UI 업데이트
function updateUI() {
    displayPlayerDeck();
    displayOpponentDeck();
    updateStats();
}

// 플레이어 덱 표시
function displayPlayerDeck() {
    const container = document.getElementById('playerDeck');
    container.innerHTML = '';
    
    game.userDeck.forEach((card, index) => {
        const isRevealed = game.userRevealedDeck[index] !== '_';
        const isNewCard = index === game.lastUserCardIndex && !isRevealed;
        const cardEl = createCardElement(card, false, isRevealed, index, isNewCard);
        container.appendChild(cardEl);
    });
}

// 상대(봇) 덱 표시
function displayOpponentDeck() {
    const container = document.getElementById('opponentDeck');
    container.innerHTML = '';
    
    game.myDeck.forEach((card, index) => {
        const isRevealed = game.correctedCard.includes(card);
        const isNewCard = index === game.lastBotCardIndex && !isRevealed;
        const cardEl = createCardElement(card, true, isRevealed, index, isNewCard);
        
        if (!isRevealed) {
            cardEl.onclick = () => selectOpponentCard(index);
        }
        
        container.appendChild(cardEl);
    });
}

// 카드 요소 생성
function createCardElement(card, isOpponent, isRevealed, index = -1, isNewCard = false) {
    const cardEl = document.createElement('div');
    cardEl.className = 'card';
    
    if (isNewCard) {
        cardEl.classList.add('new-card');
    }
    
    if (isRevealed) {
        cardEl.classList.add('revealed');
        cardEl.textContent = formatCardDisplay(card);
        const color = card[card.length - 1];
        cardEl.classList.add(color === 'w' ? 'white' : 'black');
    } else if (isOpponent) {
        cardEl.classList.add('back');
        const color = card[card.length - 1];
        cardEl.classList.add(color === 'w' ? 'white-back' : 'black-back');
        cardEl.dataset.index = index;
    } else {
        cardEl.textContent = formatCardDisplay(card);
        const color = card[card.length - 1];
        cardEl.classList.add(color === 'w' ? 'white' : 'black');
    }
    
    return cardEl;
}

// 카드 표시 형식 변환
function formatCardDisplay(card) {
    if (card.startsWith('a0')) return '10';
    if (card.startsWith('a1')) return '11';
    if (card.startsWith('-')) return '🃏';
    return card.slice(0, card.length - 1);
}

// 상대 카드 선택
function selectOpponentCard(index) {
    if (waitingForNumber || !game.userFlag) return;
    
    game.selectedCardIndex = index;
    
    document.querySelectorAll('.opponent-deck .card').forEach((card, i) => {
        if (i === index && !card.classList.contains('revealed')) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    });
    
    showNumberSelector();
}

// 숫자 선택 패널 표시
function showNumberSelector() {
    const selector = document.getElementById('numberSelector');
    const grid = document.getElementById('numberGrid');
    const modal = document.getElementById('numberModal');

    grid.innerHTML = '';

    const availableCards = game.getAvailableNumbers();
    const selectedCardColor = game.myDeck[game.selectedCardIndex][game.myDeck[game.selectedCardIndex].length - 1];

    const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];

    numbers.forEach(num => {
        const cardNum = num === '10' ? 'a0' : (num === '11' ? 'a1' : num);
        const fullCard = cardNum + selectedCardColor;
        const btn = document.createElement('button');
        btn.className = 'number-btn';
        btn.textContent = num;

        if (!availableCards.includes(fullCard)) {
            btn.disabled = true;
        } else {
            btn.onclick = () => selectNumber(cardNum);
        }

        grid.appendChild(btn);
    });

    const jokerCard = '-' + selectedCardColor;
    const jokerBtn = document.getElementById('jokerBtn');
    jokerBtn.disabled = !availableCards.includes(jokerCard);
    jokerBtn.onclick = () => selectNumber('-');

    if (modal) modal.classList.add('active');
    selector.classList.add('active');
    waitingForNumber = true;
}

// 숫자 선택
function selectNumber(number) {
    if (game.selectedCardIndex === null) return;
    
    const cardColor = game.myDeck[game.selectedCardIndex][game.myDeck[game.selectedCardIndex].length - 1];
    let guessCard = number + cardColor;
    // 기록: 플레이어가 이번에 추측한 카드를 게임 상태에 저장
    try {
        if (game) game.playertriedcard = guessCard;
    } catch (e) {}

    hideNumberSelector();
    makeGuess(game.selectedCardIndex, guessCard);
}

// 숫자 선택 취소
function cancelSelection() {
    hideNumberSelector();
    document.querySelectorAll('.opponent-deck .card').forEach(card => {
        card.classList.remove('selected');
    });
    game.selectedCardIndex = null;
}

// 숫자 선택 패널 숨기기
function hideNumberSelector() {
    const modal = document.getElementById('numberModal');
    const selector = document.getElementById('numberSelector');
    if (modal) modal.classList.remove('active');
    if (selector) selector.classList.remove('active');
    waitingForNumber = false;
}

// 추측하기
function makeGuess(position, card) {
    const isCorrect = game.validateUserGuess(position, card);
    // game.playertriedcard = card;
    
    game.turn ++;
    if (isCorrect) {
        showToast(`✅ 정답! ${formatCardDisplay(card)}가 맞습니다!`, 'success');
        game.turnFirst = false;
        game.hasGuessedThisTurn = true;
        
        const cards = document.querySelectorAll('.opponent-deck .card');
        if (cards[position]) {
            cards[position].classList.add('flipping');
            setTimeout(() => {
                displayOpponentDeck();
            }, 300);
        }
        
        if (game.isGameOver()) {
            setTimeout(() => {
                showGameOver(true);
            }, 800);
            return;
        }
        
        updateUI();
        updateTurnIndicator('정답! 계속 추측하거나 턴을 넘기세요');
        document.getElementById('passBtn').disabled = false;
    } else {
        showToast(`❌ 오답! ${formatCardDisplay(card)}가 아닙니다`, 'error');
        
        const revealedCard = game.revealRandomUserCard();
        if (revealedCard) {
            showToast(`내 카드 ${formatCardDisplay(revealedCard.card)}가 공개되었습니다`, 'error');
        }
        
        game.turnFirst = true;
        game.hasGuessedThisTurn = false;
        
        document.querySelectorAll('.opponent-deck .card').forEach(card => {
            card.classList.remove('selected');
        });
        
        if (game.isPlayerGameOver()) {
            setTimeout(() => {
                showGameOver(false);
            }, 1500);
            return;
        }
        
        updateTurnIndicator('AI의 차례...');
        disableButtons();
        
        setTimeout(() => {
            executeBotTurn();
        }, 1500);
    }
    
    game.selectedCardIndex = null;
}

// 조커 배치 모달 표시
function showJokerPlacementModal() {
    const modal = document.getElementById('jokerModal');
    const grid = document.getElementById('positionGrid');
    
    grid.innerHTML = '';
    
    for (let i = 0; i <= game.userDeck.length; i++) {
        const btn = document.createElement('button');
        btn.className = 'position-btn';
        btn.textContent = i + 1;
        btn.onclick = () => placeJoker(i);
        grid.appendChild(btn);
    }
    
    modal.classList.add('active');
    disableButtons();
}

// 플레이어가 카드 색상을 선택하는 모달
function showColorChoiceModal(callback) {
    // callback(result)
    // result: { card, index?, needsPosition }
    // 동적으로 모달 생성
    let modal = document.getElementById('colorModal');
    if (modal) modal.remove();
    modal = document.createElement('div');
    modal.id = 'colorModal';
    modal.className = 'modal active';

    // overlay (dimming background)
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    modal.appendChild(overlay);

    // modal box that uses stylesheet classes instead of inline styles
    const box = document.createElement('div');
    box.className = 'modal-box color-choice-box';

    const title = document.createElement('div');
    title.textContent = '카드 색상을 선택하세요';
    title.style.marginBottom = '8px';
    box.appendChild(title);

    const choicesWrap = document.createElement('div');
    choicesWrap.className = 'color-choices';

    function makeBackCard(colorLabel) {
        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.alignItems = 'center';

        const cardBack = document.createElement('div');
        cardBack.className = `card back ${colorLabel === 'w' ? 'white-back' : 'black-back'}`;

        // const label = document.createElement('div');
        // label.textContent = colorLabel === 'w' ? '하얀 카드' : '검정 카드';
        // label.style.marginTop = '8px';   
        // label.style.fontSize = '14px';

        cardBack.onclick = () => {
            document.body.removeChild(modal);
            document.body.classList.remove('modal-open');
            const result = game.userAddCardWithColor(colorLabel);
            if (callback) callback(result);
        };

        wrapper.appendChild(cardBack);
        // wrapper.appendChild(label);
        return wrapper;
    }

    choicesWrap.appendChild(makeBackCard('w'));
    choicesWrap.appendChild(makeBackCard('b'));
    box.appendChild(choicesWrap);

    modal.appendChild(box);
    document.body.appendChild(modal);
    // prevent background scroll / interaction while modal open
    document.body.classList.add('modal-open');
    // Do NOT close the color selection modal when clicking the overlay.
    // The modal should only close once the user selects a card color.
    // (Overlay remains to block background interaction.)
}

// 조커 배치
function placeJoker(position) {
    game.insertJokerToUserDeck(position);
    document.getElementById('jokerModal').classList.remove('active');
    showToast('조커를 배치했습니다', 'success');
    displayPlayerDeck();
    // 조커 배치는 플레이어의 카드 수에 영향을 주므로 턴을 동기화
    syncTurnCount();
    enableButtons();
    updateTurnIndicator('상대 카드를 예측하세요');
}

// 턴 넘기기
function passTurn() {
    if (!game.hasGuessedThisTurn) {
        showToast('최소 한 번은 추측해야 합니다', 'error');
        return;
    }
    
    showToast('턴을 넘겼습니다', 'info');
    game.turnFirst = true;
    game.hasGuessedThisTurn = false;
    game.lastBotCardIndex = null;
    updateTurnIndicator('AI의 차례...');
    disableButtons();
    
    setTimeout(() => {
        executeBotTurn();
    }, 1000);
}

// AI 턴 실행
function executeBotTurn() {    
    // Use persistent storage on `game` for the card the AI drew at the
    // beginning of its turn. executeBotTurn may be called multiple times
    // while the AI continues guessing in the same turn; in that case we
    // should reuse the same drawn card rather than losing it.
    let addedCard = game.lastAddedCard || null;
    if (game.turnFirst) {
        // start of a new AI turn: draw a card and persist it
        game.lastAddedCard = game.myAddCard();
        addedCard = game.lastAddedCard;
        showToast(`AI가 카드를 뽑았습니다`, 'info');
        game.deleteOverlap();
        displayOpponentDeck();
        // AI가 뽑은 카드 강조를 잠시 보여줬다가 제거
        setTimeout(() => {
            game.lastBotCardIndex = null;
            displayOpponentDeck();
        }, 2500);
    }
    
    setTimeout(() => {
        // 가능한 모든 상대 덱을 생성하고 최적 선택을 찾는다
        const allDeck = game.generatePossibleDeck();
        const { ifJoker, noJoker } = game.findBestChoice(allDeck);

        const finalResult = game.isThereJoker ? ifJoker : noJoker;
        updateStats();

        // 기준: 이전에 턴을 넘겼고 최고 후보의 평균 성공률이 낮으면 패스
        if (!game.turnFirst && finalResult.length > 0 && (finalResult[0].successRate + finalResult[0].noJokerRate) / 2 <= 33.4) {
            showToast('AI가 턴을 넘겼습니다', 'info');
            // game.turn is derived from player's deck size; no manual increment
            game.turnFirst = true;
            game.botFlag = true;
            game.lastBotCardIndex = null;

            // 플레이어 카드 자동 뽑기 (색상 선택)
            showColorChoiceModal(result => {
                if (!result) return;
                if (result.needsPosition) {
                    showJokerPlacementModal();
                } else {
                    // 플레이어가 카드를 뽑았으므로 턴을 동기화
                    syncTurnCount();
                    showToast(`카드 ${formatCardDisplay(result.card)}를 뽑았습니다`, 'info');
                    displayPlayerDeck();
                    updateTurnIndicator('상대 카드를 예측하세요');
                    enableButtons();
                    document.getElementById('passBtn').disabled = true;
                    setTimeout(() => {
                        game.lastUserCardIndex = null;
                        displayPlayerDeck();
                    }, 2500);
                }
            });
            return;
        }

        // 후보 중 이미 시도한 조합이나 불필요한 조커 후보를 건너뛴다
        let selectedIndex = null;
        for (let i = 0; i < finalResult.length; i++) {
            const choiceObj = finalResult[i];
            const [pos, card] = choiceObj.choice;
            const alreadyTried = game.triedChoices.some(([p, c]) => p === pos && c === card);
            
            // 이미 공개된 카드는 건너뛰기 (Python 코드의 revealed_deck 체크)
            const alreadyRevealed = game.revealedDeck[pos] !== '_' && game.revealedDeck[pos] === card;

            if (alreadyTried || alreadyRevealed || (choiceObj.noJokerRate === 0 && choiceObj.successRate < 80 && card[0] === '-')) {
                continue;
            }
            selectedIndex = i;
            break;
        }

        if (selectedIndex === null) {
            showToast('AI가 턴을 넘겼습니다', 'info');
            // game.turn is derived from player's deck size; no manual increment
            game.turnFirst = true;
            game.botFlag = true;
            game.lastBotCardIndex = null;
            showColorChoiceModal(result => {
                if (!result) return;
                if (result.needsPosition) showJokerPlacementModal();
                else {
                    // 플레이어가 카드를 뽑았으므로 턴 동기화
                    syncTurnCount();
                    showToast(`카드 ${formatCardDisplay(result.card)}를 뽑았습니다`, 'info');
                    displayPlayerDeck();
                    updateTurnIndicator('상대 카드를 예측하세요');
                    enableButtons();
                    document.getElementById('passBtn').disabled = true;
                }
            });
            updateUI();
            return;
        }

        const chosen = finalResult[selectedIndex];
        const [position, card] = chosen.choice;
        game.triedChoices.push([position, card]);

        showToast(`AI 예측: ${position + 1}번째 카드는 ${formatCardDisplay(card)} (${chosen.noJokerRate.toFixed(1)}%)`, 'info');

        setTimeout(() => {
            const isCorrect = game.validateBotGuess(position, card);
            
            game.turn ++;
            if (isCorrect) {
                showToast('AI가 정답을 맞췄습니다!', 'success');
                game.turnFirst = false;
                displayPlayerDeck();

                // 플레이어의 모든 카드가 공개되었는지 즉시 확인
                if (game.isPlayerGameOver()) {
                    setTimeout(() => showGameOver(false), 800);
                    return;
                }

                // 기존의 allDeck 기반 종료 체크(추가 안전망)
                if (allDeck.length === 1) {
                    setTimeout(() => showGameOver(false), 1500);
                    return;
                }

                setTimeout(() => executeBotTurn(), 2000);
            } else {
                showToast(`AI가 오답! 공개될 카드: ${addedCard.card}`, 'error');

                // Python 코드와 동일하게: AI가 이번 턴에 뽑은 카드를 공개
                if (addedCard && addedCard.card) {
                    if (!game.correctedCard.includes(addedCard.card)) {
                        game.correctedCard.push(addedCard.card);
                    }
                    showToast(`AI의 ${addedCard.index + 1}번째 카드 ${formatCardDisplay(addedCard.card)}가 공개되었습니다.`, 'info');
                    displayOpponentDeck();
                    game.deleteOverlap();
                }

                game.turnFirst = true;
                game.botFlag = true;
                game.lastBotCardIndex = null;

                // 플레이어 자동 카드 뽑기 (색상 선택)
                showColorChoiceModal(result => {
                    if (!result) return;
                    if (result.needsPosition) {
                        showJokerPlacementModal();
                    } else {
                        // 플레이어가 카드를 뽑았으므로 턴 동기화
                        syncTurnCount();
                        showToast(`카드 ${formatCardDisplay(result.card)}를 뽑았습니다`, 'info');
                        displayPlayerDeck();
                        updateTurnIndicator('상대 카드를 예측하세요');
                        enableButtons();
                        document.getElementById('passBtn').disabled = true;
                        setTimeout(() => {
                            game.lastUserCardIndex = null;
                            displayPlayerDeck();
                        }, 2500);
                    }
                });
            }

            updateUI();
        }, 1500);
    }, 1000);
}

// 통계 업데이트
function updateStats() {
    document.getElementById('turnCount').textContent = game.turn;
    document.getElementById('correctCount').textContent = game.correctedCard.length;
}

// Sync turn count to player's deck size
function syncTurnCount() {
    if (!game) return;
    // turn 기준을 플레이어가 뽑은 카드 개수로 설정
    // game.turn = game.userDeck.length - 4;
    updateStats();
}

// 턴 표시 업데이트
function updateTurnIndicator(text) {
    document.getElementById('turnIndicator').textContent = text;
}

// 버튼 활성화/비활성화
function enableButtons() {
    document.getElementById('passBtn').disabled = !game.hasGuessedThisTurn;
}

function disableButtons() {
    document.getElementById('passBtn').disabled = true;
}

// 토스트 메시지 표시
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');

    try { console.log(`[${type.toUpperCase()}] ${message}`); } catch (e) {}

    const log = document.getElementById('toastLog');
    if (log) {
        const item = document.createElement('div');
        item.className = `log-item ${type}`;
        const time = new Date().toLocaleTimeString();
        const timeSpan = document.createElement('span');
        timeSpan.className = 'log-time';
        timeSpan.textContent = time;
        item.appendChild(timeSpan);
        const textNode = document.createElement('span');
        textNode.textContent = message;
        item.appendChild(textNode);
        if (log.firstChild) log.insertBefore(item, log.firstChild);
        else log.appendChild(item);
    }

    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

// 게임 오버 모달
function showGameOver(playerWon) {
    const modal = document.getElementById('gameOverModal');
    const icon = document.getElementById('winnerIcon');
    const text = document.getElementById('winnerText');
    const message = document.getElementById('winnerMessage');
    
    if (playerWon) {
        icon.textContent = '🎉';
        text.textContent = '승리!';
        message.textContent = '축하합니다! 모든 카드를 맞추셨습니다!';
    } else {
        icon.textContent = '😢';
        text.textContent = '패배';
        message.textContent = 'AI가 당신의 카드를 모두 맞췄습니다.';
    }
    
    modal.classList.add('active');
    disableButtons();
}

function closeModal() {
    document.getElementById('gameOverModal').classList.remove('active');
}

// 덱 분석 테스트
function testGenerateDeck() {
    const allDecks = game.generatePossibleDeck();
    document.getElementById('possibleDecks').textContent = allDecks.length;
    showToast(`가능한 덱: ${allDecks.length}개`, 'info');
    console.log('가능한 덱 목록:', allDecks);
}

// 페이지 로드 시 메시지
window.onload = () => {
    showToast('🎮 새 게임을 시작하세요!', 'info');
};