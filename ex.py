import random
from itertools import combinations, permutations

white_deck = ['0w', '1w', '2w', '3w', '4w', '5w', '6w', '7w', '8w', '9w', 'a0w', 'a1w']
black_deck = ['0b', '1b', '2b', '3b', '4b', '5b', '6b', '7b', '8b', '9b', 'a0b', 'a1b']
fixed_lst = white_deck + black_deck + ['-w', '-b']
num_black = 2; num_white = 2

revealed_deck = []

def DeleteOverlap():
    global white_deck
    global black_deck

    overlap = []
    for i, l in enumerate(white_deck):
        if l not in my_deck:
            overlap.append(l)
    white_deck = overlap.copy()
    overlap = []
    for i, l in enumerate(black_deck):
        if l not in my_deck:
            overlap.append(l)
    black_deck = overlap.copy()


#가능한 상대의 모든 덱 생성
def GeneratePossibleDeck(num_black: int, num_white: int) -> list:
    global cnt_no_joker

    all_deck = []
    possible_black = list(combinations(black_deck, num_black))
    possible_white = list(combinations(white_deck, num_white))
    iter = [i for i in range(0, num_white + num_black)]

    user_color = show_deck_color(user_deck)
    cnt_no_joker = 1

    for i in possible_black:
        for j in possible_white:
            purpose = sorted(list(i + j))
            if purpose[0][0] == "-":
                cases = generate_all_combinations(purpose)
                # print(cases)
                for k in cases:
                    all_deck.append(k)
            else:
                flag =True
                for index, l in enumerate(purpose):
                    if user_color[index] not in l:
                        flag = False
                        break
                if flag:
                    is_revealed = True
                    for k, l in enumerate(purpose):
                        if revealed_deck[k] != '_' and purpose[k] != revealed_deck[k]:
                            is_revealed = False
                            break
                    if is_revealed:
                        all_deck.append(purpose)
                        cnt_no_joker += 1

    return all_deck


def generate_all_combinations(lst: list) -> list:
    # 플래그와 정수 분리
    flags = [x for x in lst if isinstance(x, str) and x.startswith('-')]
    integers = [x for x in lst if not (isinstance(x, str) and x.startswith('-'))]

    # 정수 정렬 (a0, a1은 문자열이므로 문자열 정렬)
    integers.sort()

    results = []
    user_color = show_deck_color(user_deck)

    # 플래그들의 모든 순열에 대해
    for flag_perm in permutations(flags):
        # n개의 정수가 있으면 n+1개의 위치(앞, 사이들, 뒤)에 플래그를 배치 가능
        # 각 플래그를 어느 위치에 넣을지 결정
        generate_placements(list(flag_perm), integers, [], 0, results)


    return results


def generate_placements(flags, integers, current, flag_idx, results):
    user_color = show_deck_color(user_deck)

    if flag_idx == len(flags):
        flag = True
        temp_lst = current + integers

        for i, l in enumerate(temp_lst):
            if user_color[i]  not in l:
                flag = False
                break
        if flag:
            # 모든 플래그를 배치했으면 남은 정수들을 추가
            is_revealed = True
            for k, l in enumerate(temp_lst):
                if revealed_deck[k] != '_' and temp_lst[k] != revealed_deck[k]:
                    is_revealed = False
            if is_revealed:
                results.append(temp_lst)
            # print(current + integers)
        return

    # 현재 플래그를 정수 앞의 각 위치에 배치
    for i in range(len(integers) + 1):
        # 플래그를 i번째 위치에 삽입
        new_current = current + integers[:i] + [flags[flag_idx]]
        new_integers = integers[i:]
        generate_placements(flags, new_integers, new_current, flag_idx + 1, results)


def FindBestChoice(all_deck, tried_choices):
    global white_deck
    global black_deck

    remaining_cards = white_deck + black_deck
    choices = []
    len_all_deck = len(all_deck)

    for i in range(len(all_deck[0])):
        choices += [(i, _) for _ in remaining_cards]

    result = []
    for selected_choice in choices:
        success_rate = 0
        no_joker = 0
        for temp_deck in all_deck:
            if temp_deck[selected_choice[0]] == selected_choice[1] and revealed_deck[selected_choice[0]] != selected_choice[1]:
                success_rate += 1
                if '-w' not in temp_deck and '-b' not in temp_deck:
                    no_joker += 1
        result.append([selected_choice, success_rate / len_all_deck * 100, no_joker/ cnt_no_joker * 100])

    return sorted(result, key=lambda x: x[1], reverse=True), sorted(result, key=lambda x: x[2], reverse=True)


def show_deck_color(lst):
    return [i[-1] for i in lst]


def user_add_card(lst: list[str]):
    global num_black; global num_white
    global tried_choices

    random_int = random.randrange(0, 25)

    while fixed_lst[random_int] in user_deck or fixed_lst[random_int] in my_deck:
        random_int = random.randrange(0, 25)

    w_pos = None; b_pos = None
    try:
        w_pos = lst.index("-w")

    except ValueError:
        pass

    try:
        b_pos = lst.index("-b")

    except ValueError:
        pass

    selected_card = fixed_lst[random_int]
    if selected_card[-1] == 'w':
        num_white += 1
    else:
        num_black += 1

    if selected_card[0] == '-':
        print(lst)
        pos_of_joker = int(input('패에 조커가 들어왔습니다. 조커를 배치할 위치를 입력하시오: '))

        lst.insert(pos_of_joker - 1, selected_card)
        tried_choices = repositioning(tried_choices, pos_of_joker - 1)

        return lst, (selected_card, lst.index(selected_card))

    else:
        lst.append(selected_card)

        if w_pos is not None or b_pos is not None:
            print(lst)

            if w_pos is not None:
                lst.remove('-w')

            if b_pos is not None:
                lst.remove('-b')

            lst.sort()

            if w_pos is not None:
                lst.insert(w_pos, '-w')

            if b_pos is not None:
                lst.insert(b_pos, '-b')

            print(lst)

            tried_choices = repositioning(tried_choices, lst.index(selected_card))
            return lst, (selected_card, lst.index(selected_card))

        tried_choices = repositioning(tried_choices, lst.index(selected_card))
        return sorted(lst), (selected_card, sorted(lst).index(selected_card))



def my_add_card(lst: list[str]):
    global num_black; global num_white

    random_int = random.randrange(0, 25)

    while fixed_lst[random_int] in user_deck or fixed_lst[random_int] in my_deck:
        random_int = random.randrange(0, 25)

    w_pos = None; b_pos = None
    try:
        w_pos = lst.index("-w"); b_pos = lst.index("-b")

    except ValueError:
        pass

    selected_card = fixed_lst[random_int]

    if selected_card[0] == '-':

        joker_pos = random.randrange(0, len(lst) - 1)
        lst.insert(joker_pos, selected_card)

        return lst, (selected_card, joker_pos)
    else:
        lst.append(selected_card)
        if w_pos is not None or b_pos is not None:

            if w_pos is not None:
                lst.remove('-w')

            if b_pos is not None:
                lst.remove('-b')

            lst.sort()

            if w_pos is not None:
                lst.insert(w_pos, '-w')

            if b_pos is not None:
                lst.insert(b_pos, '-b')

            return lst, (selected_card, lst.index(selected_card))

        return sorted(lst), (selected_card, sorted(lst).index(selected_card))


def repositioning(lst: list, added_position: int) -> list:
    for i, l in enumerate(lst):
        if l[0] >= added_position:
            temp = list(l)
            temp[0] += 1
            lst[i] = tuple(temp.copy())

    return lst


#덱 뽑기 (각자 검정 둘, 하양 둘)
my_deck = [] + random.sample(white_deck, 2) + random.sample(black_deck, 2)
user_deck = [] + random.sample(white_deck, 2) + random.sample(black_deck, 2)
while len(list(set(my_deck).intersection(user_deck))) > 0:
    user_deck = [] + random.sample(white_deck, 2) + random.sample(black_deck, 2)

my_deck.sort(); user_deck.sort()
revealed_deck = ['_'] * 4

DeleteOverlap()

# white_deck.append("-w"); black_deck.append('-b')

num_black = 2; num_white = 2

#내가 전에 시도했던 선택 제외
tried_choices = []

turn = 1
bot_flag = True
user_flag = True
turn_first = True
is_there_joker = False
winner = '컴퓨터'

white_deck.append("-w")
black_deck.append('-b')

corrected_card = []

while True:
    if bot_flag:
        if turn_first:
            user_deck, added_card_info = user_add_card(user_deck)

        print(f"\n{turn}턴.")
        print(f"내 덱: {user_deck}\n")
        show_deck = []
        for i in my_deck:
            if i in corrected_card:
                show_deck.append(i)
                continue
            show_deck.append(i[-1])
        print(f"상대 덱: {show_deck}")

        pos, c = map(str, input("예측할 위치, 카드 입력: ").split())
        pos = str(int(pos) - 1)

        if my_deck[int(pos)] == c:
            print("정답!")
            turn_first = False
            corrected_card.append(c)
            DeleteOverlap()

            if input("턴을 넘기시겠습니까? (에: 0, 아니오: 아무 키나 입력): ") == '0':
                turn_first = True
                is_there_joker = True
                turn += 1

                revealed_deck.insert(added_card_info[1], '_')

            else:
                continue

        else:
            print("오답")
            # if c in white_deck: white_deck.remove(c)
            # if c in black_deck: black_deck.remove(c)
            revealed_deck.insert(added_card_info[1], added_card_info[0])

            if added_card_info[0][0] == '-':
                is_there_joker = True

            turn_first = True

    if user_flag:
        if turn_first:
            my_deck, added_card_info = my_add_card(my_deck)
            DeleteOverlap()

        # print(f"내 덱: {user_deck}\n")
        # print(f"컴퓨터 덱: {my_deck}")

        print(f"컴퓨터 시점: {revealed_deck}")

        all_deck = GeneratePossibleDeck(num_black, num_white)
        print(f"가능한 상대의 덱 수: {len(all_deck)}")
        if_joker, no_joker = FindBestChoice(all_deck, tried_choices)
        # print(if_joker)
        # print(no_joker)

        if not is_there_joker:
            final_result = no_joker.copy()
        else:
            final_result = if_joker.copy()

        if not turn_first and (final_result[0][1] + final_result[0][2]) / 2 <= 33.4:
            print("컴퓨터가 차례를 넘겼습니다!")
            bot_flag = True
            turn_first = True
            DeleteOverlap()
            turn += 1

            continue

        sc = None
        correct_flag = False
        for i, l in enumerate(final_result):
            if l[0] in tried_choices or (l[2] == 0.0 and l[1] < 80.0 and l[0][1][0] == '-'):
                continue
            else:
                sc = i
                break

        print(f"예측: 당신의 {final_result[sc][0][0] + 1}번째 카드는 {final_result[sc][0][1]} (예측 성공률: {final_result[sc][2]}%)")
        tried_choices.append((final_result[sc][0][0], final_result[sc][0][1]))

        if user_deck[final_result[sc][0][0]] == final_result[sc][0][1]:
            print("컴퓨터가 정답을 맞줬습니다!\n")
            revealed_deck[final_result[sc][0][0]] = final_result[sc][0][1]


            if len(all_deck) == 1: break

            turn_first = False
            bot_flag = False
            correct_flag = True

        else:
            print("컴퓨터가 정답을 맞추지 못했습니다.")
            print(f"컴퓨터의 {added_card_info[1] + 1}번째 카드는 {added_card_info[0]}입니다.")
            corrected_card.append(added_card_info[0])

            bot_flag = True
            turn_first = True

        DeleteOverlap()

        continue

    turn += 1

    DeleteOverlap()

print(f"GAME OVER! \n 승자: {winner}")
#사람 선택
