import { getActorPostRepository } from "@/lib/posts/postRepository";
import { stubPostRepository } from "@/lib/posts/repositories/stubPostRepository";
import { getStubPostsEnabled } from "@/lib/env";

jest.mock("@/lib/env", () => ({
  getStubPostsEnabled: jest.fn(),
}));

jest.mock("@/lib/posts/repositories/dbPostRepository", () => ({
  createDbPostRepository: jest.fn((opts: { actorUserId: string }) => ({
    __isDbRepository: true,
    actorUserId: opts.actorUserId,
  })),
}));

const createDbPostRepository = jest.requireMock(
  "@/lib/posts/repositories/dbPostRepository"
).createDbPostRepository;

describe("postRepository switch (TC-013, TC-014, TC-015)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("TC-015: getActorPostRepository returns DB path when development + USE_STUB_POSTS=false", () => {
    (getStubPostsEnabled as jest.Mock).mockReturnValue(false);

    const repo = getActorPostRepository("user-001");

    expect(repo).not.toBe(stubPostRepository);
    expect(createDbPostRepository).toHaveBeenCalledWith({ actorUserId: "user-001" });
  });

  it("getActorPostRepository returns stub when USE_STUB_POSTS=true", () => {
    (getStubPostsEnabled as jest.Mock).mockReturnValue(true);

    const repo = getActorPostRepository("user-001");

    expect(repo).toBe(stubPostRepository);
    expect(createDbPostRepository).not.toHaveBeenCalled();
  });
});
