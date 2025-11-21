class DavinciCodeGame {
    constructor() {
        this.whiteDeck = ['0w', '1w', '2w', '3w', '4w', '5w', '6w', '7w', '8w', '9w', 'a0w', 'a1w'];
        this.blackDeck = ['0b', '1b', '2b', '3b', '4b', '5b', '6b', '7b', '8b', '9b', 'a0b', 'a1b'];
        this.fixedList = [...this.whiteDeck, ...this.blackDeck, '-w', '-b'];
        
        this.myDeck = [];
        this.userDeck = [];
        this.revealedDeck = [];
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
        this.deleteOverlap();

        this.whiteDeck.push('-w');
        this.blackDeck.push('-b');
        
        this.turn = 1;
        this.correctedCard = [];
        this.triedChoices = [];
        this.turnFirst = true;
        this.userFlag = true;
        this.botFlag = true;
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
            this.triedChoices = this.repositioning(this.triedChoices, cardIndex);
            return { card: randomCard, index: cardIndex, needsPosition: false };
        }
    }

    insertJokerToUserDeck(position) {
        const joker = this.pendingJoker;
        this.userDeck.splice(position, 0, joker);
        this.triedChoices = this.repositioning(this.triedChoices, position);
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
            const jokerPos = Math.floor(Math.random() * this.myDeck.length);
            this.myDeck.splice(jokerPos, 0, randomCard);
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

            return { card: randomCard, index: this.myDeck.indexOf(randomCard) };
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

    generatePossibleDeck() {
        const allDeck = [];
        const possibleBlack = this.combinations(this.blackDeck, this.numBlack);
        const possibleWhite = this.combinations(this.whiteDeck, this.numWhite);
        const userColor = this.showDeckColor(this.userDeck);
        this.cntNoJoker = 1;

        for (const blackCards of possibleBlack) {
            for (const whiteCards of possibleWhite) {
                const purpose = [...blackCards, ...whiteCards].sort();
                
                if (purpose[0] && purpose[0][0] === '-') {
                    const cases = this.generateAllCombinations(purpose);
                    allDeck.push(...cases);
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
                            if (this.revealedDeck[k] !== '_' && purpose[k] !== this.revealedDeck[k]) {
                                isRevealed = false;
                                break;
                            }
                        }
                        if (isRevealed) {
                            allDeck.push(purpose);
                            this.cntNoJoker++;
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
                    if (this.revealedDeck[k] !== '_' && tempLst[k] !== this.revealedDeck[k]) {
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

        for (let i = 0; i < allDeck[0].length; i++) {
            for (const card of remainingCards) {
                choices.push([i, card]);
            }
        }

        const result = [];
        for (const [pos, card] of choices) {
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
            this.deleteOverlap();
            return true;
        }
        return false;
    }

    isGameOver() {
        return this.correctedCard.length === this.myDeck.length;
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
    
    updateUI();
    updateTurnIndicator('당신의 차례입니다');
    showToast('게임이 시작되었습니다!', 'success');
    
    document.getElementById('drawBtn').disabled = false;
    document.getElementById('passBtn').disabled = false;
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
        const cardEl = createCardElement(card, false, false);
        container.appendChild(cardEl);
    });
}

// 상대(봇) 덱 표시
function displayOpponentDeck() {
    const container = document.getElementById('opponentDeck');
    container.innerHTML = '';
    
    game.myDeck.forEach((card, index) => {
        const isRevealed = game.correctedCard.includes(card);
        const cardEl = createCardElement(card, true, isRevealed, index);
        
        if (!isRevealed) {
            cardEl.onclick = () => selectOpponentCard(index);
        }
        
        container.appendChild(cardEl);
    });
}

// 카드 요소 생성
function createCardElement(card, isOpponent, isRevealed, index = -1) {
    const cardEl = document.createElement('div');
    cardEl.className = 'card';
    
    if (isRevealed) {
        // 공개된 카드
        cardEl.classList.add('revealed');
        cardEl.textContent = card;
        const color = card[card.length - 1];
        cardEl.classList.add(color === 'w' ? 'white' : 'black');
    } else if (isOpponent) {
        // 상대방 카드 뒷면 (색상만 보임)
        cardEl.classList.add('back');
        const color = card[card.length - 1];
        cardEl.classList.add(color === 'w' ? 'white-back' : 'black-back');
        cardEl.dataset.index = index;
    } else {
        // 내 카드 앞면
        cardEl.textContent = card;
        const color = card[card.length - 1];
        cardEl.classList.add(color === 'w' ? 'white' : 'black');
    }
    
    return cardEl;
}

// 상대 카드 선택
function selectOpponentCard(index) {
    if (waitingForNumber || !game.userFlag) return;
    
    game.selectedCardIndex = index;
    
    // 선택된 카드 강조
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
    
    grid.innerHTML = '';
    
    const availableCards = game.getAvailableNumbers();
    const selectedCardColor = game.myDeck[game.selectedCardIndex][game.myDeck[game.selectedCardIndex].length - 1];
    
    // 선택된 카드의 색상에 맞는 숫자만 표시
    const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a0', 'a1'];
    
    numbers.forEach(num => {
        const fullCard = num + selectedCardColor;
        const btn = document.createElement('button');
        btn.className = 'number-btn';
        btn.textContent = num;
        
        if (!availableCards.includes(fullCard)) {
            btn.disabled = true;
        } else {
            btn.onclick = () => selectNumber(num);
        }
        
        grid.appendChild(btn);
    });
    
    selector.classList.add('active');
    waitingForNumber = true;
}

// 숫자 선택
function selectNumber(number) {
    if (game.selectedCardIndex === null) return;
    
    const cardColor = game.myDeck[game.selectedCardIndex][game.myDeck[game.selectedCardIndex].length - 1];
    let guessCard;
    
    if (number === '-w' || number === '-b') {
        guessCard = number;
    } else {
        guessCard = number + cardColor;
    }
    
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
    document.getElementById('numberSelector').classList.remove('active');
    waitingForNumber = false;
}

// 추측하기
function makeGuess(position, card) {
    const isCorrect = game.validateUserGuess(position, card);
    
    if (isCorrect) {
        showToast(`✅ 정답! ${card}가 맞습니다!`, 'success');
        game.turnFirst = false;
        
        // 카드 뒤집기 애니메이션
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
        updateTurnIndicator('정답! 계속 추측하세요');
    } else {
        showToast(`❌ 오답! ${card}가 아닙니다`, 'error');
        game.turnFirst = true;
        
        document.querySelectorAll('.opponent-deck .card').forEach(card => {
            card.classList.remove('selected');
        });
        
        updateTurnIndicator('AI의 차례...');
        disableButtons();
        
        setTimeout(() => {
            executeBotTurn();
        }, 1500);
    }
    
    game.selectedCardIndex = null;
}

// 카드 뽑기
function drawCard() {
    const result = game.userAddCard();
    
    if (result.needsPosition) {
        showJokerPlacementModal();
    } else {
        showToast(`카드 ${result.card}를 뽑았습니다`, 'info');
        displayPlayerDeck();
    }
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

// 조커 배치
function placeJoker(position) {
    game.insertJokerToUserDeck(position);
    document.getElementById('jokerModal').classList.remove('active');
    showToast('조커를 배치했습니다', 'success');
    displayPlayerDeck();
    enableButtons();
}

// 턴 넘기기
function passTurn() {
    showToast('턴을 넘겼습니다', 'info');
    game.turn++;
    game.turnFirst = true;
    updateTurnIndicator('AI의 차례...');
    disableButtons();
    
    setTimeout(() => {
        executeBotTurn();
    }, 1000);
}

// AI 턴 실행
function executeBotTurn() {
    if (game.turnFirst) {
        const addedCard = game.myAddCard();
        showToast(`AI가 카드를 뽑았습니다`, 'info');
        game.deleteOverlap();
        displayOpponentDeck();
    }
    
    setTimeout(() => {
        const botAction = game.botTurn();
        updateStats();
        
        if (botAction.action === 'pass') {
            showToast('AI가 턴을 넘겼습니다', 'info');
            game.turn++;
            game.turnFirst = true;
            game.botFlag = true;
            updateTurnIndicator('당신의 차례입니다');
            enableButtons();
            return;
        }
        
        const { position, card, successRate } = botAction;
        showToast(`AI 예측: ${position + 1}번째 카드는 ${card} (${successRate.toFixed(1)}%)`, 'info');
        
        setTimeout(() => {
            const isCorrect = game.validateBotGuess(position, card);
            
            if (isCorrect) {
                showToast('AI가 정답을 맞췄습니다!', 'error');
                game.turnFirst = false;
                
                displayPlayerDeck();
                
                const allDeck = game.generatePossibleDeck();
                if (allDeck.length === 1) {
                    setTimeout(() => {
                        showGameOver(false);
                    }, 1500);
                    return;
                }
                
                setTimeout(() => {
                    executeBotTurn();
                }, 2000);
            } else {
                showToast('AI가 오답!', 'success');
                game.turnFirst = true;
                game.botFlag = true;
                updateTurnIndicator('당신의 차례입니다');
                enableButtons();
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

// 턴 표시 업데이트
function updateTurnIndicator(text) {
    document.getElementById('turnIndicator').textContent = text;
}

// 버튼 활성화/비활성화
function enableButtons() {
    document.getElementById('drawBtn').disabled = false;
    document.getElementById('passBtn').disabled = false;
}

function disableButtons() {
    document.getElementById('drawBtn').disabled = true;
    document.getElementById('passBtn').disabled = true;
}

// 토스트 메시지 표시
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
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