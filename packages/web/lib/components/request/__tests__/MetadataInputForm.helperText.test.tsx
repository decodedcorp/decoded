/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, test, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  MetadataInputForm,
  type MetadataFormValues,
} from "../MetadataInputForm";

const baseValues: MetadataFormValues = {
  mediaType: "user_upload",
  mediaDescription: "",
  groupName: "",
  artistName: "",
  context: null,
};

const renderForm = (overrides: Partial<MetadataFormValues> = {}) =>
  render(
    <MetadataInputForm
      values={{ ...baseValues, ...overrides }}
      onChange={vi.fn()}
    />
  );

describe("MetadataInputForm — helper text + dynamic placeholder (ported from PR #230)", () => {
  afterEach(() => cleanup());

  test("renders the media-type helper text", () => {
    renderForm();
    expect(
      screen.getByText("What kind of media is this image from?")
    ).toBeInTheDocument();
  });

  test("renders the artist helper text", () => {
    renderForm();
    expect(
      screen.getByText("Actor, singer, model, or public figure in the image")
    ).toBeInTheDocument();
  });

  test("renders the group / agency helper text", () => {
    renderForm();
    expect(
      screen.getByText(
        "Group (e.g., BLACKPINK) or agency (e.g., YG Entertainment)"
      )
    ).toBeInTheDocument();
  });

  test("description placeholder uses user_upload example for direct uploads", () => {
    renderForm({ mediaType: "user_upload" });
    expect(
      screen.getByPlaceholderText("e.g., your own photo or gallery shot")
    ).toBeInTheDocument();
  });

  test("description placeholder uses youtube-specific example", () => {
    renderForm({ mediaType: "youtube" });
    expect(
      screen.getByPlaceholderText("e.g., BLACKPINK channel — dance practice")
    ).toBeInTheDocument();
  });

  test("description placeholder swaps to drama-specific example", () => {
    renderForm({ mediaType: "drama" });
    expect(
      screen.getByPlaceholderText("e.g., The Glory, Squid Game")
    ).toBeInTheDocument();
  });

  test("description placeholder swaps to music_video-specific example", () => {
    renderForm({ mediaType: "music_video" });
    expect(
      screen.getByPlaceholderText("e.g., BLACKPINK - How You Like That")
    ).toBeInTheDocument();
  });

  test("description placeholder swaps to event-specific example", () => {
    renderForm({ mediaType: "event" });
    expect(
      screen.getByPlaceholderText("e.g., 2024 Met Gala, Coachella")
    ).toBeInTheDocument();
  });
});

describe("MetadataInputForm — context picker (#292 Part A)", () => {
  afterEach(() => cleanup());

  const expectedLabels = [
    "Daily",
    "Street",
    "Airport",
    "Stage",
    "Photoshoot",
    "Campaign",
    "Event",
    "Drama",
    "Variety",
    "SNS",
    "Fan Meeting",
    "Interview",
  ];

  test("renders all 12 context chips including the newly added options", () => {
    renderForm();
    for (const label of expectedLabels) {
      expect(
        screen.getByRole("button", { name: new RegExp(label, "i") })
      ).toBeInTheDocument();
    }
  });

  test("clicking a chip emits the value through onChange", () => {
    const onChange = vi.fn();
    render(<MetadataInputForm values={baseValues} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /street/i }));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ context: "street" })
    );
  });

  test("clicking the already-selected chip toggles the value back to null", () => {
    const onChange = vi.fn();
    render(
      <MetadataInputForm
        values={{ ...baseValues, context: "airport" }}
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /airport/i }));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ context: null })
    );
  });
});
