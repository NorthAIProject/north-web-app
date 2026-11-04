<!-- The privacy policy (north-client web/legal/privacy.templ). Public: somebody deciding whether to trust Khepri with their health data has to be able to read it before signing up. -->
<script lang="ts">
	import LegalDocument from '#lib/features/legal/LegalDocument.svelte';
	import LegalSection from '#lib/features/legal/LegalSection.svelte';
	import { contactEmail, operatorAddress, operatorName } from '#lib/features/legal/legal.js';
	import PageTitle from '#lib/features/landing/PageTitle.svelte';
</script>

<PageTitle title="Privacy" />

<LegalDocument title="Privacy policy">
	<p class="lead">
		Khepri holds an unusual amount of information about the people who use it — what they weigh, how
		they slept, where they ran, and what they wrote in a journal at eleven at night. This page says
		exactly what is stored, where it goes, and how to get it back or delete it.
	</p>
	<p>
		{operatorName} ({operatorAddress}) is the controller of that data. Questions, requests and
		complaints:
		<a href="mailto:{contactEmail}">{contactEmail}</a>.
	</p>
	<LegalSection heading="What is stored">
		<p>
			Only what you or an integration you connected put there. Nothing is bought from a data broker
			and nothing is inferred from third-party tracking.
		</p>
		<ul>
			<li>
				<strong>Account</strong> — email address, display name, a password hash (never the password),
				timezone, coaching-tone preference. If you sign in with Google or a passkey, the identifier that
				provider gives us.
			</li>
			<li>
				<strong>Health and body data</strong> — weight, body measurements, sleep, hydration, and any biometric
				readings you record or a connected device pushes.
			</li>
			<li>
				<strong>Activity and location</strong> — workouts, training plans, activity sessions, and, if
				you connect Strava, your activities including the route traces they carry. A route trace is location
				data about where you actually were.
			</li>
			<li><strong>Nutrition</strong> — foods, meal plans and what you logged.</li>
			<li>
				<strong>Your writing</strong> — check-ins, journal entries, decisions, goals, and every message
				you exchange with the coach.
			</li>
			<li>
				<strong>Memory</strong> — durable facts the system derives from your conversations so it does
				not have to ask twice. You can see, edit, pin and delete these.
			</li>
			<li>
				<strong>Documents</strong> — files you upload, the text extracted from them, and numeric embeddings
				of that text used for search.
			</li>
			<li>
				<strong>Integrations</strong> — access tokens for services you connect, encrypted at rest; your
				Telegram chat identifier if you link it; tokens issued to agents you authorise.
			</li>
			<li>
				<strong>Operational records</strong> — sign-in events, account activity, model usage and cost,
				and error logs.
			</li>
		</ul>
	</LegalSection>
	<LegalSection heading="Health data needs your explicit consent">
		<p>
			Most of the list above is ordinary personal data. Weight, sleep, biometrics and anything
			health-related in your journal are <em>special category</em> data under Article 9 of the UK
			and EU GDPR, and are processed <strong>only on your explicit consent</strong>, given when you
			create an account and record it.
		</p>
		<p>
			You can withdraw that consent at any time by deleting the data or your account. Withdrawal
			does not undo processing that already happened, and Khepri stops working in any meaningful way
			without it — a coach with no health data is a chat window.
		</p>
	</LegalSection>
	<LegalSection heading="Where your data goes">
		<p>
			Khepri is not advertising-funded and sells nothing to anyone. Data reaches other companies
			only where the product cannot work otherwise:
		</p>
		<ul>
			<li>
				<strong>AI providers.</strong> This is the disclosure that matters most, and nothing goes to
				them until you allow it. The app asks you first, and you can change your answer at any time
				in Settings under AI Data Sharing. If you decline, AI features stay off and the rest of
				Khepri keeps working.
				<p>
					What is sent, to answer you and to run the coach, reports, meal and training plans: your
					messages and the context assembled for them, which can include your name, age and time
					zone, goals, recent conversations and their summaries, check-ins, journal entries and
					decisions, workouts, sleep, weight, measurements, nutrition, medications, data you share
					from Apple Health, what the coach remembers about you, your calendar if you connected it,
					and files, photos and form-check videos you choose to send.
				</p>
				<p>
					Who receives it: the companies below run the models. The app shows which of them are in
					use before you answer.
				</p>
				<ul>
					<li>Anthropic (Claude)</li>
					<li>Google (Gemini)</li>
					<li>NVIDIA</li>
					<li>OpenRouter, which forwards a request to the company behind the model it selects</li>
				</ul>
				<p>
					Each of them is held to protection of your data equal to what this policy describes. They
					receive it only to provide these features, and Khepri does not sell it or use it for
					advertising. You may supply your own API key instead, in which case your data goes first
					to your provider under your own agreement with them.
				</p>
			</li>
			<li>
				<strong>Strava</strong> — only if you connect it, and only to read your activities.
			</li>
			<li>
				<strong>Telegram</strong> — only if you link a chat. Your messages and the coach's replies pass
				through Telegram's servers, under Telegram's own policy.
			</li>
			<li>
				<strong>Product analytics.</strong> A small number of events — account created, onboarding
				finished, a source connected, the coach answered — recorded against your account identifier
				to see whether the product works. No health data, no message content, no document text.
				<br />
				Your browser also reports the pages you open. Inside the application that is the address only,
				with anything after the <code>?</code> removed, so a page's contents and any link that
				carries a token are not included. On the public pages — the home page, sign-up, sign-in,
				these policies, and the screen that asks whether to connect an agent — it also reports which
				buttons and links get clicked, which is how we tell a page that reads well from one that
				does not.
				<br />
				The home page and the connect-an-agent screen additionally record the session itself, so we can
				see where a first-time visitor gets stuck. Everything typed into a field is masked before it leaves
				the browser, and no page you reach after signing in is ever recorded.
			</li>
			<li>
				<strong>Hosting, storage and email</strong> — the servers the application runs on, object storage
				for files you upload, and a mail provider for account email such as password resets.
			</li>
		</ul>
	</LegalSection>
	<LegalSection heading="How long it is kept">
		<p>
			Until you delete it. Long conversations are summarised rather than discarded, because the
			point of the product is that it remembers — so a thread you had months ago may survive as a
			summary after its individual messages are compacted.
		</p>
		<p>
			Deleting your account removes your data. Backups and logs containing incidental records may
			persist for a short period before rotating out.
		</p>
	</LegalSection>
	<LegalSection heading="What you can do">
		<p>
			Under the UK and EU GDPR you may access, correct, delete, export, restrict or object to the
			processing of your data, and withdraw consent. Two of these need no request at all:
		</p>
		<ul>
			<li>
				<strong>Export</strong> — Settings → a complete archive of your data, downloaded immediately.
			</li>
			<li>
				<strong>Deletion</strong> — Settings → delete account.
			</li>
		</ul>
		<p>
			For anything else, write to
			<a href="mailto:{contactEmail}">{contactEmail}</a>. If you are unhappy with the response you
			may complain to your data protection authority — in the UK, the Information Commissioner's
			Office.
		</p>
	</LegalSection>
	<LegalSection heading="Security, honestly stated">
		<p>
			Passwords are hashed. Integration tokens are encrypted at rest. Sessions are protected against
			cross-site request forgery, and you can see your account's sign-in history.
		</p>
		<p>
			Khepri is built and run by a very small team. It is not independently audited and holds no
			security certification. If that is not an acceptable custodian for your health data, the
			honest advice is not to store it here.
		</p>
	</LegalSection>
	<LegalSection heading="Changes">
		<p>
			Material changes will be announced in the application before they take effect. The date at the
			top of this page is when it last changed.
		</p>
	</LegalSection>
</LegalDocument>
