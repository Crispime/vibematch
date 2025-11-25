import { CreateDiscussionModal } from "../CreateDiscussionModal";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function CreateDiscussionModalExample() {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-6">
      <Button onClick={() => setOpen(true)}>Open Modal</Button>
      <CreateDiscussionModal open={open} onOpenChange={setOpen} />
    </div>
  );
}
