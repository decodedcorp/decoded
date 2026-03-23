def get_example_text_metadata() -> dict:
    return {
        "product_name": "Classic White T-Shirt",
        "material": "100% Cotton",
        "price": "29.99",
        "currency": "USD",
    }


def get_example_image_metadata() -> dict:
    return {
        "base64_image": "iVBORw0KGgoAAAANSUhEUgAA...",  # base64로 인코딩된 이미지
        "source_url": "https://example.com/image.jpg",
    }


def get_example_link_metadata() -> dict:
    return {
        "summary": "This is a summary of the linked content",
        "qa_pairs": [
            {
                "question": "What is the main topic?",
                "answer": "The main topic is about sustainable fashion",
            },
            {
                "question": "What are the key points?",
                "answer": "The key points include environmental impact",
            },
        ],
        "og_image": "https://example.com/og-image.jpg",
        "og_title": "Sustainable Fashion Guide 2024",
        "og_description": "A comprehensive guide to sustainable fashion practices",
    }
