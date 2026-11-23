"""
Aegis Creator & Media Production Studio Service
================================================
Engineers high-retention video scripts, viral hooks, YouTube/Shorts metadata,
thumbnail concept briefs, and B-roll pacing cues for digital creators.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger("aegis.services.creator")


class CreatorService:
    """Creator, video editor, and digital media production engine."""

    @classmethod
    def generate_video_package(cls, topic: str, format_type: str = "YouTube Longform") -> Dict[str, Any]:
        """Generate high-retention video script, hooks, and thumbnail concepts."""
        is_short = "short" in format_type.lower() or "reel" in format_type.lower()

        hooks = [
            f"Most people think {topic} is complicated, but in the next 60 seconds I will reveal the one secret that changes everything.",
            f"I spent 100 hours testing {topic} so you don't have to waste your time and money.",
            f"Stop doing {topic} the old way. Here is why the top 1% are switching right now.",
        ]

        title_options = [
            f"Why Everyone Is Wrong About {topic.title()}",
            f"How I Mastered {topic.title()} in 7 Days (Zero Fluff)",
            f"{topic.title()} - The Untold Truth Nobody Talks About",
            f"Do NOT Touch {topic.title()} Until You Watch This",
        ]

        if is_short:
            script_scenes = [
                {"time": "0:00 - 0:03", "section": "Visual Pattern Interrupt", "audio": hooks[0], "visual": "Fast whip-pan zoom into subject holding relevant physical prop. Subtitles pop in bold yellow."},
                {"time": "0:03 - 0:15", "section": "The Core Problem", "audio": f"Here is the mistake 90% make with {topic}: they jump in without checking this one setting.", "visual": "Quick B-roll screen capture with red circle highlighting mistake."},
                {"time": "0:15 - 0:45", "section": "The 3-Step Fix", "audio": "Step 1: Simplify your input. Step 2: Automate the repeat tasks. Step 3: Test before publishing.", "visual": "Punchy 3-beat montage with satisfying click sound effects."},
                {"time": "0:45 - 0:60", "section": "High-Converting CTA", "audio": f"Drop a comment if you want my personal template for {topic}, and follow for part 2!", "visual": "Subject smiles, text graphic slides in pointing to follow button."},
            ]
        else:
            script_scenes = [
                {"time": "0:00 - 0:45", "section": "Cold Open & The Stakes", "audio": hooks[1], "visual": "Dynamic cinematic B-roll, fast-paced cuts, sound risers settling into title card."},
                {"time": "0:45 - 3:00", "section": "Foundational Context", "audio": f"Why {topic} became the defining topic of 2026, and the hidden bottleneck everyone overlooks.", "visual": "Over-the-shoulder workstation footage, subtle screen graphics with clean typography."},
                {"time": "3:00 - 7:30", "section": "Deep Breakdown & Case Studies", "audio": "Live walk-through with real numbers, actionable steps, and mistake breakdowns.", "visual": "Split screen: Host on left, crystal-clear screen recordings and diagrams on right."},
                {"time": "7:30 - 9:00", "section": "Pro-Tips for Video Editors & Creators", "audio": "How to package your workflow so you produce twice as much in half the time.", "visual": "Montage of timeline scrubbing, fast keyboard shortcuts, macro pad taps."},
                {"time": "9:00 - 10:00", "section": "Conclusion & Meaningful Outro", "audio": "Thank you for watching. Remember: great work is made with love and craft, not shortcuts.", "visual": "Warm ambient studio lighting, soft acoustic outro, end screen cards."},
            ]

        thumbnail_concepts = [
            {
                "concept": "High Curiosity & Contrast",
                "visual": f"Expressive host face on left with shock/curiosity. Right side shows bold text '{topic.upper()}' with a green verified checkmark vs red X.",
                "colors": "Deep navy background (#0D1B2A), Warm Amber text (#F4A261), Lime accent (#2A9D8F).",
            },
            {
                "concept": "Before vs After Transformation",
                "visual": "Split thumbnail: Left side greyed out and messy labeled 'BEFORE'. Right side vivid 4K, organized, glowing warm parchment labeled 'AFTER'.",
                "colors": "Monochrome contrast shifting into warm golden lighting.",
            },
        ]

        return {
            "topic": topic,
            "format": format_type,
            "title_options": title_options,
            "viral_hooks": hooks,
            "production_script": script_scenes,
            "thumbnail_concepts": thumbnail_concepts,
            "seo_tags": [topic.lower(), f"{topic.lower()} tutorial", f"{topic.lower()} guide", "creator workflow", "2026 strategies", "masterclass"],
            "editor_notes": [
                "Cut all pauses longer than 0.3 seconds in the first 30 seconds.",
                "Use subtle whoosh SFX on every visual transition.",
                "Warm color grading: boost mid-tone saturation by +4, add soft film grain at 15% opacity.",
            ],
        }
