export default function CguPage() {
  return (
    <div className="flex flex-col">
      <section className="bg-[var(--primary)] px-6 py-16 text-white text-center">
        <div className="mx-auto max-w-2xl">
          <p className="text-sm font-medium text-white/60 uppercase tracking-widest mb-3">
            Légal
          </p>
          <h1 className="text-4xl font-bold">
            Conditions Générales d&apos;Utilisation
          </h1>
          <p className="mt-3 text-white/70 text-sm">Dernière mise à jour : septembre 2026</p>
        </div>
      </section>

      <section className="bg-background px-6 py-16">
        <div className="mx-auto max-w-2xl prose prose-slate prose-headings:text-[var(--primary)] prose-headings:font-bold prose-a:text-[var(--primary)] [&_h2]:scroll-mt-24">
          <h2>1. Présentation du service</h2>
          <p>
            Mibegnon est une plateforme qui recense des bourses d&apos;études et des universités mondiales à destination des élèves de Côte d&apos;Ivoire. L&apos;accès au catalogue, aux favoris et au suivi de candidatures est libre et sans frais. En complément, Mibegnon propose un service optionnel et payant, l&apos;<a href="#accompagnement">Accompagnement personnalisé</a>, décrit à l&apos;article 6.
          </p>

          <h2>2. Inscription et compte utilisateur</h2>
          <p>
            La création d&apos;un compte est facultative mais recommandée pour sauvegarder des bourses et suivre des candidatures. Tu t&apos;engages à fournir des informations exactes lors de l&apos;inscription et à garder ton mot de passe confidentiel.
          </p>

          <h2>3. Utilisation du service</h2>
          <p>En utilisant Mibegnon, tu t&apos;engages à :</p>
          <ul>
            <li>Ne pas utiliser la plateforme à des fins frauduleuses ou illégales</li>
            <li>Ne pas tenter de pirater, de surcharger ou de perturber le service</li>
            <li>Ne pas créer plusieurs comptes pour contourner d&apos;éventuelles restrictions</li>
          </ul>

          <h2>4. Exactitude des informations</h2>
          <p>
            Mibegnon s&apos;efforce de fournir des informations précises et à jour sur les bourses et universités. Cependant, nous ne pouvons garantir l&apos;exactitude de toutes les données. <strong>Vérifie toujours les informations directement auprès de l&apos;organisme concerné avant de postuler.</strong>
          </p>

          <h2>5. Gratuité du catalogue</h2>
          <p>
            Le catalogue Mibegnon (bourses, universités, favoris, suivi de candidatures, Chao) est et restera <strong>gratuit pour les élèves ivoiriens</strong>. Nous ne prenons aucune commission sur les candidatures et ne demandons aucun paiement pour accéder à ces informations. Seul l&apos;Accompagnement personnalisé décrit ci-dessous est payant, et il n&apos;est jamais obligatoire.
          </p>

          <h2 id="accompagnement">6. Accompagnement personnalisé (service payant)</h2>

          <h3>6.1 Ce que comprend le service</h3>
          <p>
            L&apos;Accompagnement personnalisé s&apos;adresse aux élèves du secondaire (en particulier en Terminale) et aux jeunes bacheliers. Il comprend :
          </p>
          <ul>
            <li>Une <strong>liste personnalisée d&apos;universités et de bourses</strong>, préparée à la main par l&apos;équipe Mibegnon à partir de ton profil (niveau, série, ville, ambitions).</li>
            <li>Des <strong>conseils personnalisés</strong> sur ta stratégie de candidature, tes documents et tes délais, publiés dans ton espace « Mon accompagnement » sur Mibegnon.</li>
            <li>L&apos;accès à un <strong>groupe WhatsApp</strong> réservé aux élèves accompagnés de la même promotion, animé par l&apos;équipe Mibegnon.</li>
            <li>Un <strong>suivi par messages</strong> (WhatsApp en priorité, SMS ou email en secours) pendant toute la durée du service.</li>
          </ul>
          <p>
            Le service dure jusqu&apos;à la fin de la campagne d&apos;admission de l&apos;année scolaire en cours, et au maximum <strong>douze (12) mois</strong> à compter de la confirmation de ton paiement.
          </p>

          <h3>6.2 Ce que le service ne comprend pas</h3>
          <ul>
            <li>Aucune <strong>garantie d&apos;admission</strong> ni d&apos;obtention de bourse : les décisions appartiennent aux universités et aux organismes.</li>
            <li>Le dépôt de candidatures à ta place, la rédaction complète de tes documents, ou la traduction certifiée de tes pièces.</li>
            <li>Le paiement de frais de dossier, de visa, d&apos;examens (TOEFL, IELTS, SAT…) ou de scolarité auprès de tiers.</li>
          </ul>

          <h3>6.3 Prix et paiement</h3>
          <p>
            Le prix du service est de <strong>2 000 FCFA</strong> (deux mille francs CFA), payable <strong>une seule fois</strong>. Il n&apos;y a aucun abonnement ni prélèvement automatique.
          </p>
          <p>
            Le paiement s&apos;effectue par <strong>Wave</strong> vers le numéro indiqué par Mibegnon dans le message qui suit ta demande, en précisant la <strong>référence</strong> qui t&apos;a été attribuée (par exemple <code>MBG-7F3K</code>). Tu nous transmets ensuite une capture d&apos;écran du reçu Wave. Mibegnon vérifie chaque paiement à la main et te confirme sous <strong>48 heures ouvrées</strong>. Le service commence à la confirmation du paiement.
          </p>
          <p>
            Ne paie jamais un montant différent de 2 000 FCFA ni vers un numéro que Mibegnon ne t&apos;a pas communiqué directement par ses canaux officiels. Toute capture d&apos;écran falsifiée entraîne le rejet de la demande et la suspension du compte.
          </p>

          <h3>6.4 Rétractation et remboursement</h3>
          <ul>
            <li>Tu peux demander le <strong>remboursement intégral</strong> tant que ton lien d&apos;activation ne t&apos;a pas été envoyé, c&apos;est-à-dire avant le début effectif du service.</li>
            <li>Si Mibegnon n&apos;a pas confirmé ton paiement ni ouvert ton espace dans les <strong>7 jours</strong> suivant la réception d&apos;un reçu valide, tu es remboursé(e) intégralement sur simple demande.</li>
            <li>Un <strong>double paiement</strong> est toujours remboursé.</li>
            <li>Une fois le service commencé (lien d&apos;activation envoyé, liste ou conseils transmis), le paiement n&apos;est plus remboursable, sauf erreur de Mibegnon.</li>
          </ul>
          <p>
            Les remboursements sont effectués par Wave, vers le numéro qui a servi au paiement, sous 7 jours.
          </p>

          <h3>6.5 Règles du groupe WhatsApp</h3>
          <p>En rejoignant le groupe des élèves accompagnés, tu t&apos;engages à :</p>
          <ul>
            <li>Rester respectueux(se) envers les autres membres et l&apos;équipe ; aucune insulte, discrimination ou harcèlement.</li>
            <li>Ne pas publier de publicité, de liens payants, de chaînes de messages ou de contenus sans rapport avec les études.</li>
            <li>Ne pas partager les numéros, informations ou documents des autres membres en dehors du groupe.</li>
            <li>Ne pas te faire passer pour un membre de l&apos;équipe Mibegnon.</li>
          </ul>
          <p>
            Ton numéro WhatsApp est visible par les autres membres du groupe : c&apos;est le fonctionnement de WhatsApp. En cas de manquement grave ou répété, Mibegnon peut te retirer du groupe et mettre fin au service, sans remboursement.
          </p>

          <h3>6.6 Élèves mineurs</h3>
          <p>
            Si tu as <strong>moins de 18 ans</strong>, tu déclares avoir informé un parent ou tuteur légal de ta demande et du paiement, et avoir obtenu son accord. Un parent peut à tout moment demander la suppression des données de l&apos;élève mineur en nous écrivant (voir article 10).
          </p>

          <h3>6.7 Tes engagements</h3>
          <p>
            Tu t&apos;engages à fournir des informations exactes dans le formulaire (notamment un numéro WhatsApp valide et ton vrai niveau d&apos;études) et à rester joignable. Sans réponse de ta part après plusieurs relances, Mibegnon peut clôturer ta demande.
          </p>

          <h2>7. Propriété intellectuelle</h2>
          <p>
            Le contenu de Mibegnon (textes, design, logo) est protégé. Les informations sur les bourses et universités sont issues de sources publiques. Les listes et conseils fournis dans le cadre de l&apos;Accompagnement te sont destinés personnellement et ne doivent pas être revendus.
          </p>

          <h2>8. Suspension de compte</h2>
          <p>
            Mibegnon se réserve le droit de suspendre un compte en cas d&apos;utilisation abusive ou de violation des présentes CGU.
          </p>

          <h2>9. Modifications</h2>
          <p>
            Ces CGU peuvent être modifiées à tout moment. En continuant à utiliser le service après une modification, tu acceptes les nouvelles conditions. Les conditions de l&apos;Accompagnement applicables sont celles en vigueur au moment de ton paiement.
          </p>

          <h2 id="contact">10. Contact</h2>
          <p>
            Pour toute question :{" "}
            <a href="mailto:contact@mibegnon.com">contact@mibegnon.com</a>
          </p>
        </div>
      </section>
    </div>
  );
}
