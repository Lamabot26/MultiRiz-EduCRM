'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StudentFormDialog } from '@/components/students/student-form-dialog';

export function AddStudentButton() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" aria-hidden /> Add Student
      </Button>
      <StudentFormDialog open={open} onOpenChange={setOpen} onSaved={() => router.refresh()} />
    </>
  );
}
