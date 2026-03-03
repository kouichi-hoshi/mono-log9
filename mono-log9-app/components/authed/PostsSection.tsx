"use client";

import * as React from "react";

import Container2, { type Container2Props } from "@/components/authed/Container2";

function PostsSection(props: Container2Props) {
  return (
    <main>
      <article>
        <Container2 {...props} />
      </article>
    </main>
  );
}

export default React.memo(PostsSection);
