import csv
import os
import sys
from collections import defaultdict


SUPPORTED_EXTS = {".jpg", ".jpeg", ".png", ".webp"}


# Keep keywords aligned with server.js emotionKeywords
EMOTION_KEYWORDS = {
    "happiness": [
        "happy", "joy", "smile", "laugh", "cheer", "festival", "dance",
        "harvest", "bloom", "breeze", "irises", "flowers", "kyoto"
    ],
    "sadness": [
        "sad", "sorrow", "grief", "tear", "crucifixion", "deluge",
        "distress", "saint", "winter", "ghost"
    ],
    "anger": [
        "angry", "rage", "fury", "battle", "devil", "tiger", "snake",
        "legend", "wetting", "storm"
    ],
    "surprise": [
        "surprise", "shock", "amaze", "ark", "noah", "manhattan", "sunrise"
    ],
    "fear": [
        "fear", "swell", "church", "sebastian", "distress"
    ],
    "disgust": [
        "bubble", "squeak"
    ],
    "neutral": [
        "hampton", "landscape", "calm", "louveciennes", "orchard", "wheat",
        "olive", "farmhouse", "harvest", "hare", "table", "bathers", "interior"
    ],
}


PRIORITY = [
    "happiness",
    "sadness",
    "anger",
    "surprise",
    "fear",
    "disgust",
    "neutral",
]


def find_bg_dir(base_dir: str) -> str:
    candidates = [
        os.path.join(base_dir, "BG_image"),
        os.path.join(os.getcwd(), "BG_image"),
    ]
    for p in candidates:
        if os.path.isdir(p):
            return p
    raise FileNotFoundError("BG_image directory not found. Checked: " + ", ".join(candidates))


def label_for_filename(filename: str):
    lower = filename.lower()
    matches_by_emotion = defaultdict(list)
    for emotion, keywords in EMOTION_KEYWORDS.items():
        for kw in keywords:
            if kw in lower:
                matches_by_emotion[emotion].append(kw)

    if not matches_by_emotion:
        return "neutral", []

    # choose emotion with max matches; tie-break by PRIORITY order
    best_emotion = None
    best_count = -1
    for emotion in PRIORITY:
        cnt = len(matches_by_emotion.get(emotion, []))
        if cnt > best_count:
            best_emotion = emotion
            best_count = cnt
    return best_emotion, matches_by_emotion[best_emotion]


def main():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    bg_dir = find_bg_dir(base_dir)

    rows = []
    for name in sorted(os.listdir(bg_dir)):
        path = os.path.join(bg_dir, name)
        if not os.path.isfile(path):
            continue
        ext = os.path.splitext(name)[1].lower()
        if ext not in SUPPORTED_EXTS:
            continue
        label, kws = label_for_filename(name)
        rows.append({
            "filename": name,
            "relative_path": f"BG_image/{name}",
            "label": label,
            "matched_keywords": ";".join(sorted(set(kws)))
        })

    out_csv = os.path.join(base_dir, "BG_image_labels.csv")
    with open(out_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["filename", "relative_path", "label", "matched_keywords"])
        writer.writeheader()
        writer.writerows(rows)

    # console summary
    counts = defaultdict(int)
    for r in rows:
        counts[r["label"]] += 1
    print("Wrote:", out_csv)
    print("Counts:")
    for k in PRIORITY:
        if counts[k]:
            print(f"  {k}: {counts[k]}")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print("Error:", e)
        sys.exit(1)


