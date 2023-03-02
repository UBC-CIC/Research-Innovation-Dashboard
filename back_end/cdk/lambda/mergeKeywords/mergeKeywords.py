from pyjarowinkler.distance import get_jaro_distance
# import psycopg2

def createHashMap(text):
   # split text into tokens by white space
    token = text.split(", ")
   
    hashMap = {}

    for word in token:
        value = hashMap.get(word)

        if value:
            hashMap[word] = value+1
        else:
            hashMap[word] = 1
    
    hashMap = dict(sorted(hashMap.items(), key=lambda item: item[1], reverse=True))
    return hashMap


def lambda_handler(event, context):
    hashMap = createHashMap("hi, bye")

    keyArray = []
    
    for keyword in list(hashMap.keys()):
        keyArray.append(keyword)
    
    for i in range((len(keyArray))-1):
        j = i+1
        while j < len(keyArray):
            if(get_jaro_distance(keyArray[i], keyArray[j]) >= 0.95):
                if hashMap.get(keyArray[i]) and hashMap.get(keyArray[j]):
                    hashMap[keyArray[i]] = hashMap.get(keyArray[i]) + hashMap.pop(keyArray[j])
            j = j + 1
    
    print(dict(sorted(hashMap.items(), key=lambda item: item[1], reverse=True)))