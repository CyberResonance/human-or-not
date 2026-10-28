// Practice chats written for this app. "answer" is who the other side really was.
export const SAMPLES = [
  {
    id: 'support-bot', title: 'Online shop support', answer: 'bot',
    text: `[14:02:10] Me: hey my parcel still hasnt arrived
[14:02:12] Alex: I'm sorry to hear that your parcel hasn't arrived yet. I understand how frustrating this can be. Could you please share your order number so I can look into it for you?
[14:02:40] Me: 48812
[14:02:42] Alex: Thank you for providing your order number. I can see that your order was shipped on Monday. Here are some possible next steps:
- Check the tracking link in your confirmation email.
- Allow 1-2 additional business days for delivery.
- Contact the courier directly if the status has not changed.
Is there anything else I can help you with today?
[14:03:05] Me: are you a real person?
[14:03:07] Alex: I'm here to help you with any questions about your order. Let me know if you need further assistance!`,
  },
  {
    id: 'friend', title: 'Planning a weekend', answer: 'human',
    text: `[19:10:02] Me: still up for saturday?
[19:12:40] Kasia: yesss
[19:12:51] Kasia: wait what time again
[19:13:30] Me: 6ish, at the old place
[19:15:02] Kasia: ok but i might be late, my sister needs the car lol
[19:15:09] Kasia: like 20 min max
[19:16:40] Me: no stress
[19:18:11] Kasia: also did u see what tomek posted 😂😂 im dead`,
  },
  {
    id: 'dating', title: 'Dating app small talk', answer: 'bot',
    text: `[21:00:00] Me: hi! how's your evening going?
[21:00:03] Mia: Hi there! My evening is going wonderfully, thank you for asking. I've been relaxing with a good book and a cup of tea. How about yours?
[21:00:30] Me: pretty chill. what book?
[21:00:33] Mia: I'm currently reading a fascinating novel about a lighthouse keeper on a remote island. It's a beautiful story about solitude, connection and the passage of time. Do you enjoy reading as well?
[21:01:10] Me: sometimes. where are you from?
[21:01:13] Mia: I'm originally from a small coastal town, which is probably why I love stories about the sea! What about you? I'd love to hear more about where you grew up.`,
  },
  {
    id: 'forum', title: 'Game forum question', answer: 'human',
    text: `[10:21:00] Me: anyone know how to beat the ice boss on hard?
[10:24:12] Dawid: dodge left when he raises the arm, not right
[10:24:30] Dawid: right side gets you every time idk why
[10:26:02] Me: tried that, still die in phase 2
[10:29:45] Dawid: phase 2 just spam fire potions honestly. took me like 30 tries
[10:30:10] Dawid: and dont lock on, camera goes crazy`,
  },
  {
    id: 'recruiter', title: 'Job offer on social media', answer: 'bot',
    text: `[09:00:00] Me: Hello, thanks for reaching out. What is the role exactly?
[09:00:04] Jordan Recruiting: Absolutely! It's a flexible remote opportunity that allows you to work from home on your own schedule. The role involves simple online tasks such as reviewing products and completing short assignments.
[09:00:40] Me: What company is it?
[09:00:44] Jordan Recruiting: Great question! We partner with several leading international brands. To get started, you'll just need to complete a short onboarding process and make a small initial deposit, which is fully refundable.
[09:01:20] Me: A deposit for a job?
[09:01:23] Jordan Recruiting: I understand your concern. Many of our members were hesitant at first, but they quickly saw great results. Feel free to ask any other questions!`,
  },
  {
    id: 'colleague', title: 'Colleague on chat', answer: 'human',
    text: `[11:02:00] Me: Do you have the Q3 numbers?
[11:05:31] Ola: not yet, finance said end of day
[11:05:40] Ola: Why, does the client need them today?
[11:06:15] Me: they asked in the morning
[11:09:02] Ola: ugh. ok I'll ping Marek, he usually has a draft.
[11:09:10] Ola: give me 15`,
  },
]
