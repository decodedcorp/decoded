"""Post editorial utilities."""


def _llm_content_to_str(content) -> str:
    """Safely extract text from LLM content (str, list of dicts, etc)."""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for item in content:
            if isinstance(item, dict):
                parts.append(item.get("text", ""))
            elif isinstance(item, str):
                parts.append(item)
            else:
                parts.append(str(item))
        return "".join(parts)
    return str(content) if content else ""
