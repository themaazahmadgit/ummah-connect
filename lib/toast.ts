import { toast } from "sonner";

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─────────────────────────────────────────────────────────────────────────────
// All IMS toasts — call by name so you get consistent flavour everywhere
// ─────────────────────────────────────────────────────────────────────────────
export const imsToast = {

  // ── Generic ──────────────────────────────────────────────────────────────
  success: (msg: string) => toast.success(msg, { description: pick(["no cap that worked fr 🔥","slayed it bestie ✨","W move lowkey goated 🐐","ate and left no crumbs 🍽️","understood the assignment 📋"]) }),
  error:   (msg: string) => toast.error(msg,   { description: pick(["bruh that flopped 💀","L moment fr fr 📉","this ain't it chief 🤦","not giving what it's supposed to give 😭"]) }),
  info:    (msg: string) => toast.info(msg,    { description: pick(["just so you know bestie 👀","fyi no cap 📢","heads up fam 🫡"]) }),

  // ── Feed / Posts ──────────────────────────────────────────────────────────
  postPublished:   () => toast.success("Post published! 🔥", { description: pick(["the ummah is about to eat fr","ate and left no crumbs ngl 🍽️","big brain post detected 🧠","and that's on periodt 💯"]) }),
  postDeleted:     () => toast("Post deleted.", { description: "it's giving clean slate era ✨" }),
  postSaved:       () => toast.success("Saved to bookmarks!", { description: "locked in for later bestie 🔖" }),
  postUnsaved:     () => toast("Removed from bookmarks.", { description: "out of the vault 📤" }),
  commentPosted:   () => toast.success("Comment dropped!", { description: pick(["said what needed to be said fr","you ate that reply ngl 🍽️","the conversation needed this W 💬"]) }),

  // ── Likes / Votes ─────────────────────────────────────────────────────────
  liked:           () => toast("Liked! ❤️", { description: "spreading love in the ummah fr" }),
  unliked:         () => toast("Like removed.", { description: "taking it back lowkey 😅" }),
  voteCast:        () => toast.success("Vote counted! 🗳️", { description: "your geopolitics opinion matters no cap" }),
  voteRemoved:     () => toast("Vote removed.", { description: "changed your mind bestie, valid 🤷" }),

  // ── Follow / Connect ──────────────────────────────────────────────────────
  followed:        (name: string) => toast.success(`Following ${name}! 🤝`, { description: pick(["squad expanded fr","main character arc continues 🎬","built different connections fr"]) }),
  unfollowed:      (name: string) => toast(`Unfollowed ${name}.`, { description: "it's not you it's me 😮‍💨" }),

  // ── Profile / Settings ────────────────────────────────────────────────────
  profileSaved:    () => toast.success("Profile saved! ✅", { description: "understood the assignment no cap 📋" }),
  avatarUpdated:   () => toast.success("Photo updated! 📸", { description: "camera-ready era activated bestie 🎬" }),
  copied:          () => toast("Copied! 📋", { description: "ctrl+c stayed undefeated 💅" }),

  // ── Groups ────────────────────────────────────────────────────────────────
  joinedGroup:     (name: string) => toast.success(`Joined ${name}! 🏠`, { description: "the group chat just got better fr" }),
  leftGroup:       (name: string) => toast(`Left ${name}.`, { description: "leaving on a high note 🚶" }),
  groupCreated:    (name: string) => toast.success(`"${name}" created! 🎉`, { description: "founder mode activated lowkey 🐐" }),

  // ── Ideas / Startups ──────────────────────────────────────────────────────
  ideaPosted:      () => toast.success("Idea posted! 💡", { description: "big brain moment, the ummah needed this 🧠" }),
  startupPosted:   () => toast.success("Startup listed! 🚀", { description: pick(["building for the ummah fr 💪","hall of builders unlocked 🏗️","next Elon Musk moment 😭 nah fr tho congrats"]) }),

  // ── World map ─────────────────────────────────────────────────────────────
  zonePosted:      () => toast.success("Zone posted! 🌍", { description: "the ummah sees it now fr 👀" }),
  plotPosted:      () => toast.success("Plot dropped! 📍", { description: "pinned on the ummah map bestie 🗺️" }),
  zoneDeleted:     () => toast("Post removed from map.", { description: "clean slate era fr ✨" }),

  // ── Reports / Moderation ──────────────────────────────────────────────────
  reportSent:      () => toast.success("Reported! 🚩", { description: "standing on business for the community 🫡" }),

  // ── Auth ─────────────────────────────────────────────────────────────────
  notLoggedIn:     () => toast.error("Sign in first bestie 🔐", { description: "door's open at /auth, literally free" }),
  signedOut:       () => toast("Signed out. Ma'a salama 👋", { description: "come back soon inshallah 🤲" }),

  // ── Errors ────────────────────────────────────────────────────────────────
  fillRequired:    () => toast.error("Fill the required fields! 🫠", { description: "bro it's literally right there 😭" }),
  networkError:    () => toast.error("Connection flopped 💀", { description: "check your wifi, we'll be here" }),
  uploadTooLarge:  () => toast.error("File too big bestie 📦", { description: "3MB max, we're not Google Drive 😭" }),

  // ── Admin ─────────────────────────────────────────────────────────────────
  digestSent:      (n: number) => toast.success(`Jumu'ah digest sent to ${n} 🕌`, { description: "barakah distribution arc fr 🤲" }),
  broadcastSent:   (n: number) => toast.success(`Broadcast sent to ${n} 📢`, { description: "message in the ummah bottle" }),

  // ── Religion selection (onboarding) ───────────────────────────────────────
  muslimSelected:  () => toast(pick(["Bro don't lie to us 💀","Real one spotted ✅","Assalamu Alaikum bestie 🕌"]), {
    description: pick(["nah jk Alhamdulillah fr 🤲","barakAllahu feek for being here 🔥","the prophet ﷺ would be proud no cap"])
  }),
  nonMuslimSelected: () => toast("Brother… ugh 😐", { description: "nah jk you're welcome wallahi, we don't gatekeep 🤝" }),
  preferNotSelected: () => toast("Understood 🫡", { description: "mysterious energy, we respect it 👀" }),
};
