export default function ConfidentialitePage() {
  return (
    <div className="flex flex-col">
      <section className="bg-[var(--primary)] px-6 py-16 text-white text-center">
        <div className="mx-auto max-w-2xl">
          <p className="text-sm font-medium text-white/60 uppercase tracking-widest mb-3">
            Légal
          </p>
          <h1 className="text-4xl font-bold">Politique de confidentialité</h1>
          <p className="mt-3 text-white/70 text-sm">Dernière mise à jour : septembre 2026</p>
        </div>
      </section>

      <section className="bg-background px-6 py-16">
        <div className="mx-auto max-w-2xl prose prose-slate prose-headings:text-[var(--primary)] prose-headings:font-bold prose-a:text-[var(--primary)] [&_h2]:scroll-mt-24">
          <h2>1. Données collectées</h2>
          <p>
            Mibegnon collecte uniquement les données nécessaires au fonctionnement du service :
          </p>
          <ul>
            <li><strong>Lors de l&apos;inscription :</strong> nom complet, adresse email, mot de passe (hashé).</li>
            <li><strong>Lors de l&apos;utilisation :</strong> bourses sauvegardées, candidatures suivies.</li>
            <li><strong>Lors d&apos;une demande d&apos;Accompagnement personnalisé :</strong> nom complet, numéro WhatsApp, adresse email (facultative), date de naissance, genre, ville ou commune de résidence, niveau d&apos;études, série et établissement, puis la capture d&apos;écran de ton reçu Wave et les documents que tu choisis de nous partager (voir article 4).</li>
            <li><strong>Automatiquement :</strong> données de navigation anonymes (pages visitées, durée de session) à des fins d&apos;amélioration du service.</li>
          </ul>

          <h2>2. Utilisation des données</h2>
          <p>Tes données sont utilisées exclusivement pour :</p>
          <ul>
            <li>Te permettre d&apos;accéder à ton compte et à tes favoris</li>
            <li>Améliorer les fonctionnalités de la plateforme</li>
            <li>T&apos;envoyer des notifications importantes (avec ton accord)</li>
            <li>Fournir l&apos;Accompagnement personnalisé si tu en fais la demande : vérifier ton paiement, préparer ta liste, te conseiller et te contacter</li>
          </ul>
          <p>
            Mibegnon <strong>ne vend jamais</strong> tes données à des tiers et ne les utilise pas à des fins publicitaires.
          </p>

          <h2>3. Stockage et sécurité</h2>
          <p>
            Tes données sont stockées de manière sécurisée via <strong>Supabase</strong>, hébergé sur des serveurs conformes aux normes européennes (RGPD). Les mots de passe sont hachés et ne sont jamais accessibles en clair. Les fichiers liés à l&apos;Accompagnement (reçus, documents) sont stockés dans un espace privé, accessible uniquement à toi et à l&apos;équipe Mibegnon.
          </p>

          <h2 id="accompagnement">4. Accompagnement personnalisé : traitement spécifique</h2>

          <h3>4.1 Pourquoi ces données</h3>
          <ul>
            <li><strong>Numéro WhatsApp :</strong> c&apos;est notre canal principal pour t&apos;envoyer les instructions de paiement, la confirmation, ton lien d&apos;activation et le suivi. Il sert aussi à t&apos;ajouter au groupe WhatsApp des élèves accompagnés.</li>
            <li><strong>Email :</strong> facultatif au moment de la demande. Il devient nécessaire à la création de ton compte Mibegnon (c&apos;est ton identifiant de connexion) et sert de copie de secours pour les messages importants.</li>
            <li><strong>Date de naissance, genre, ville, niveau, série, établissement :</strong> pour préparer une liste d&apos;universités et de bourses réellement adaptée à ton profil et à ton âge.</li>
            <li><strong>Capture d&apos;écran du reçu Wave :</strong> uniquement pour vérifier ton paiement. Nous ne relevons que le montant, la date et l&apos;identifiant de transaction.</li>
            <li><strong>Documents partagés (bulletins, relevés…) :</strong> uniquement si tu choisis de les envoyer, pour affiner nos conseils.</li>
          </ul>

          <h3>4.2 Canaux et prestataires</h3>
          <p>
            Pour te contacter, Mibegnon utilise WhatsApp (service de Meta Platforms) et, en secours, des SMS et des emails envoyés via des prestataires spécialisés. Ces prestataires reçoivent uniquement ton numéro ou ton email et le contenu du message, et n&apos;ont pas le droit d&apos;utiliser ces données pour leur propre compte. Nous conservons un historique des messages envoyés afin d&apos;assurer la continuité de ton suivi.
          </p>
          <p>
            Dans le groupe WhatsApp, ton numéro et ton nom de profil sont visibles par les autres membres, comme pour tout groupe WhatsApp. Tu peux quitter le groupe à tout moment sans perdre l&apos;accès à ton espace « Mon accompagnement ».
          </p>

          <h3>4.3 Durées de conservation</h3>
          <ul>
            <li><strong>Demande sans paiement, rejetée ou sans réponse :</strong> supprimée automatiquement 90 jours après la dernière mise à jour.</li>
            <li><strong>Capture d&apos;écran du reçu Wave :</strong> conservée 12 mois après la confirmation du paiement (preuve en cas de litige), puis supprimée.</li>
            <li><strong>Profil, liste, conseils et documents de l&apos;Accompagnement :</strong> conservés pendant la durée du service, puis 12 mois, puis supprimés ou anonymisés à des fins statistiques.</li>
            <li><strong>Historique des messages :</strong> même durée que ton Accompagnement.</li>
          </ul>
          <p>Tu peux demander la suppression anticipée de tout ou partie de ces données à tout moment (voir article 5).</p>

          <h3>4.4 Élèves mineurs</h3>
          <p>
            Beaucoup d&apos;élèves accompagnés ont moins de 18 ans. Nous ne collectons que les données strictement nécessaires au service, nous ne les utilisons jamais à des fins commerciales ou publicitaires, et nous ne les transmettons à aucun tiers en dehors des prestataires techniques mentionnés ci-dessus. Si tu es mineur(e), un parent ou tuteur doit être informé de ta demande. Un parent ou tuteur peut, sur simple demande à{" "}
            <a href="mailto:contact@mibegnon.com">contact@mibegnon.com</a>, accéder aux données de l&apos;élève, les corriger ou les faire supprimer.
          </p>

          <h2>5. Tes droits</h2>
          <p>Tu as le droit de :</p>
          <ul>
            <li>Accéder à toutes tes données personnelles</li>
            <li>Demander la correction ou la suppression de tes données</li>
            <li>Exporter tes données</li>
            <li>Te désinscrire à tout moment</li>
          </ul>
          <p>
            Pour exercer ces droits, écris-nous à{" "}
            <a href="mailto:contact@mibegnon.com">contact@mibegnon.com</a>.
          </p>

          <h2>6. Cookies</h2>
          <p>
            Mibegnon utilise uniquement des cookies essentiels pour maintenir ta session active et limiter les abus (par exemple sur le chatbot Chao ou les formulaires). Aucun cookie publicitaire ou de tracking tiers n&apos;est utilisé.
          </p>

          <h2>7. Contact</h2>
          <p>
            Pour toute question relative à la confidentialité :{" "}
            <a href="mailto:contact@mibegnon.com">contact@mibegnon.com</a>
          </p>
        </div>
      </section>
    </div>
  );
}
