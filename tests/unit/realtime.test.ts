import { describe, it, expect, vi } from "vitest";
import { subscribeToGroupChanges } from "@/lib/realtime";

const makeChannel = () => {
  const channel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
  };
  return channel;
};

describe("subscribeToGroupChanges", () => {
  it("items と categories と groups チャネルを購読する", () => {
    const channel = makeChannel();
    const mockSupabase = {
      channel: vi.fn().mockReturnValue(channel),
      removeChannel: vi.fn(),
    } as any;

    const onItem = vi.fn();
    const onCategory = vi.fn();
    const onGroup = vi.fn();
    const cleanup = subscribeToGroupChanges(
      mockSupabase,
      "group-123",
      onItem,
      onCategory,
      onGroup,
    );

    expect(mockSupabase.channel).toHaveBeenCalledWith("group:group-123");
    expect(channel.on).toHaveBeenCalledTimes(3);
    expect(channel.subscribe).toHaveBeenCalledTimes(1);

    cleanup();
    expect(mockSupabase.removeChannel).toHaveBeenCalledWith(channel);
  });

  it("onGroupChange が省略されたとき .on() は 2 回だけ呼ばれる", () => {
    const channel = makeChannel();
    const mockSupabase = {
      channel: vi.fn().mockReturnValue(channel),
      removeChannel: vi.fn(),
    } as any;

    subscribeToGroupChanges(mockSupabase, "group-123", vi.fn(), vi.fn());

    expect(channel.on).toHaveBeenCalledTimes(2);
  });
});
