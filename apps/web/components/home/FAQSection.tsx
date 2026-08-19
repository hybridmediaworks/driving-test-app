import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/Accordion";
import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "Tips for taking knowledge test",
    answer:
      "Focus on Key Areas (Traffic Laws, Road Signs, Alcohol and Drugs, Parking Rules); Read Questions Carefully; Eliminate Obviously Incorrect Options; Review Your Answers and Arrive Early",
  },
  {
    question: "Tips for taking DMV tests",
    answer:
      "Practice regularly with mock tests, arrive early on test day, bring all required documents, stay calm and read each question carefully before answering.",
  },
  {
    question: "Is the app available in Spanish",
    answer:
      "Yes, our app supports Spanish and several other languages. You can switch the language from the settings menu inside the app.",
  },
  {
    question: "Do I have to make an appointment to apply for the test",
    answer:
      "Most DMV offices require an appointment. You can schedule one online through the official DMV website or call your local office directly.",
  },
  {
    question: "What happens if you fail the test?",
    answer:
      "If you fail, you may retake the test after a waiting period (typically 1–7 days depending on your state). Some states limit the number of attempts before requiring additional fees.",
  },
  {
    question:
      "What are the total number of questions and the passing score for car written test",
    answer:
      "The number of questions varies by state, typically ranging from 20 to 46. The passing score is usually 70–80% correct answers depending on your state's requirements.",
  },
  {
    question: "How long to wait before retaking the written test and road test",
    answer:
      "Waiting periods vary by state. For the written test it is typically 1–7 days; for the road test it can range from 1 day to 2 weeks after a failed attempt.",
  },
  {
    question: "How to review your weak topic?",
    answer:
      "After each practice test, the app highlights the categories where you missed questions. Focus your study time on those sections using our topic-specific practice modules.",
  },
  {
    question: "How does the Motorcycle course work?",
    answer:
      "The motorcycle course covers traffic laws specific to motorcycles, safe riding techniques, and hazard awareness. It includes practice questions modeled after the official motorcycle knowledge test.",
  },
  {
    question: "How does the CDL course work?",
    answer:
      "The CDL course prepares you for the Commercial Driver's License exam, covering general knowledge, air brakes, combination vehicles, and endorsements like hazmat and tanker.",
  },
  {
    question: "How does online driver's license course work?",
    answer:
      "Our online course lets you study at your own pace with video lessons, interactive quizzes, and full-length practice tests that mirror the actual DMV exam.",
  },
];

type FAQSectionProps = {
  className?: string;
};

export default function FAQSection({ className }: FAQSectionProps) {
  return (
    <section className={cn("px-5 pb-15 lg:pt-15 lg:pb-12", className)}>
      <div className="mx-auto max-w-226.5 space-y-15 rounded-xl bg-white p-6 lg:p-15">
        <div className="flex flex-col items-center justify-center gap-8">
          <Paragraph
            className="border-b border-blue-100 px-3.5 py-1.25 font-bold tracking-[1.2px] text-blue-700! uppercase"
            size="xs"
            color="primary"
          >
            ✦&nbsp; How we help
          </Paragraph>
          <Heading as="h2" className="mx-auto max-w-176 text-center">
            Frequently asked questions
          </Heading>
        </div>
        <div>
          <Accordion defaultValue={["item-0"]} className="gap-5">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border-b-2 border-blue-100 pb-5 data-open:border-blue-500"
              >
                <AccordionTrigger className="items-start gap-3 py-0 hover:no-underline **:data-[slot=accordion-trigger-icon]:size-6 **:data-[slot=accordion-trigger-icon]:text-neutral-400">
                  <div className="flex flex-1 items-start gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-base font-normal text-blue-500">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <Paragraph size="xl" className="flex-1 font-semibold">
                      {faq.question}
                    </Paragraph>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="ml-11 pt-3 pb-0">
                  <Paragraph className="font-medium text-neutral-500!">
                    {faq.answer}
                  </Paragraph>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
