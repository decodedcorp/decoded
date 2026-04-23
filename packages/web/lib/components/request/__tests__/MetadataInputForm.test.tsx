/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MetadataInputForm } from "../MetadataInputForm";
import type { MetadataFormValues } from "../MetadataInputForm";

const baseValues = (
  overrides: Partial<MetadataFormValues> = {}
): MetadataFormValues => ({
  mediaType: "user_upload",
  mediaDescription: "",
  groupName: "",
  artistName: "",
  context: null,
  structured: {},
  ...overrides,
});

describe("MetadataInputForm — source type conditional fields (#305)", () => {
  beforeEach(() => cleanup());

  test("user_upload: description textarea visible, no structured inputs", () => {
    render(<MetadataInputForm values={baseValues()} onChange={vi.fn()} />);
    expect(
      screen.getByLabelText(/Where is this photo from/i)
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/^Title$/i)).not.toBeInTheDocument();
  });

  test("drama: Title/Platform/Year visible, description hidden", () => {
    render(
      <MetadataInputForm
        values={baseValues({ mediaType: "drama" })}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByLabelText(/^Title$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Platform/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Year/i)).toBeInTheDocument();
    expect(
      screen.queryByLabelText(/Where is this photo from/i)
    ).not.toBeInTheDocument();
  });

  test("movie: same structured fields as drama", () => {
    render(
      <MetadataInputForm
        values={baseValues({ mediaType: "movie" })}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByLabelText(/^Title$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Platform/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Year/i)).toBeInTheDocument();
  });

  test("music_video: Title + Year, no Platform/Episode; Artist label MV placeholder", () => {
    render(
      <MetadataInputForm
        values={baseValues({ mediaType: "music_video" })}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByLabelText(/^Title$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Year/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Platform/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Episode/i)).not.toBeInTheDocument();
    const artistInput = screen.getByLabelText(/Artist/i) as HTMLInputElement;
    expect(artistInput.placeholder).toMatch(/e\.g\./i);
  });

  test("variety: Title + Episode, no Platform/Year", () => {
    render(
      <MetadataInputForm
        values={baseValues({ mediaType: "variety" })}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByLabelText(/^Title$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Episode/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Platform/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Year/i)).not.toBeInTheDocument();
  });

  test("event: Title + Year + Location", () => {
    render(
      <MetadataInputForm
        values={baseValues({ mediaType: "event" })}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByLabelText(/^Title$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Year/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Location/i)).toBeInTheDocument();
  });

  test("other: description textarea visible, no structured inputs", () => {
    render(
      <MetadataInputForm
        values={baseValues({ mediaType: "other" })}
        onChange={vi.fn()}
      />
    );
    expect(
      screen.getByLabelText(/Where is this photo from/i)
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/^Title$/i)).not.toBeInTheDocument();
  });

  test("onChange includes structured patch when a structured field is edited", () => {
    const onChange = vi.fn();
    render(
      <MetadataInputForm
        values={baseValues({ mediaType: "drama" })}
        onChange={onChange}
      />
    );
    fireEvent.change(screen.getByLabelText(/^Title$/i), {
      target: { value: "The Glory" },
    });
    const last = onChange.mock.calls[
      onChange.mock.calls.length - 1
    ]![0] as MetadataFormValues;
    expect(last.structured.title).toBe("The Glory");
  });
});
