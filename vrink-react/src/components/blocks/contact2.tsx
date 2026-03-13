import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Contact2Props {
  id?: string;
  className?: string;
  title?: string;
  description?: string;
  phone?: string;
  email?: string;
  web?: { label: string; url: string };
}

export function Contact2({
  id,
  className,
  title = "Contact Us",
  description = "도입 문의, 제휴, 데모 요청까지 빠르게 답변드립니다. 아래 폼에 내용을 남겨주세요.",
  phone = "02-1234-5678",
  email = "hello@vrink.kr",
  web = { label: "vrink.kr", url: "https://vrink.kr" },
}: Contact2Props) {
  return (
    <section id={id} className={cn("relative z-10 py-24 md:py-28", className)}>
      <div className="container mx-auto">
        <div className="mx-auto flex max-w-screen-xl flex-col justify-between gap-10 lg:flex-row lg:gap-20">
          <div className="mx-auto flex max-w-sm flex-col justify-between gap-10">
            <div className="text-center lg:text-left">
              <h2 className="mb-2 text-4xl font-semibold tracking-tight lg:mb-1 lg:text-6xl">{title}</h2>
              <p className="text-muted-foreground">{description}</p>
            </div>
            <div className="mx-auto w-fit lg:mx-0">
              <h3 className="mb-6 text-center text-2xl font-semibold lg:text-left">Contact Details</h3>
              <ul className="ml-4 list-disc space-y-2">
                <li>
                  <span className="font-bold">Phone: </span>
                  {phone}
                </li>
                <li>
                  <span className="font-bold">Email: </span>
                  <a href={`mailto:${email}`} className="underline">
                    {email}
                  </a>
                </li>
                <li>
                  <span className="font-bold">Web: </span>
                  <a href={web.url} target="_blank" rel="noreferrer" className="underline">
                    {web.label}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-screen-md flex-col gap-6 rounded-lg border bg-card p-8 md:p-10">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="contact-firstname">First Name</Label>
                <Input type="text" id="contact-firstname" placeholder="First Name" />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="contact-lastname">Last Name</Label>
                <Input type="text" id="contact-lastname" placeholder="Last Name" />
              </div>
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="contact-email">Email</Label>
              <Input type="email" id="contact-email" placeholder="Email" />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="contact-subject">Subject</Label>
              <Input type="text" id="contact-subject" placeholder="Subject" />
            </div>
            <div className="grid w-full gap-1.5">
              <Label htmlFor="contact-message">Message</Label>
              <Textarea placeholder="Type your message here." id="contact-message" />
            </div>
            <Button className="w-full">Send Message</Button>
          </div>
        </div>
      </div>
    </section>
  );
}
