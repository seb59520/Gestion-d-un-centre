import { useState } from 'react';
import { Book, Search, ChevronRight, ChevronDown } from 'lucide-react';

export default function Help() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const helpSections = [
    {
      title: "Démarrage",
      content: [
        "Bienvenue dans le système de gestion du centre de loisirs !",
        "Ce guide vous aidera à comprendre comment utiliser efficacement le système."
      ],
      subsections: [
        {
          title: "Premiers pas",
          content: [
            "1. Configurez les informations de base de votre centre dans les Paramètres",
            "2. Ajoutez vos animateurs dans la section Animateurs",
            "3. Créez des périodes d'activité dans la section Périodes",
            "4. Planifiez vos activités dans la section Activités"
          ]
        }
      ]
    },
    {
      title: "Gestion des Animateurs",
      content: [
        "La section Animateurs vous permet de gérer efficacement votre équipe."
      ],
      subsections: [
        {
          title: "Ajouter des Animateurs",
          content: [
            "1. Cliquez sur 'Ajouter un Animateur'",
            "2. Remplissez leurs informations personnelles",
            "3. Téléchargez les documents requis (vaccinations, diplômes)",
            "4. Chaque animateur recevra un lien d'accès personnel pour le pointage"
          ]
        },
        {
          title: "Gestion des Documents",
          content: [
            "• Surveillez les dates d'expiration des documents",
            "• Recevez des notifications automatiques pour les documents expirants",
            "• Suivez les certifications requises",
            "• Validez les documents téléchargés"
          ]
        }
      ]
    },
    {
      title: "Gestion des Périodes",
      content: [
        "Gérez différentes périodes d'activité tout au long de l'année."
      ],
      subsections: [
        {
          title: "Créer des Périodes",
          content: [
            "1. Choisissez entre les mercredis ou les vacances",
            "2. Sélectionnez parmi les périodes de vacances prédéfinies",
            "3. Option de diviser les périodes en semaines",
            "4. Assignez des animateurs aux périodes"
          ]
        }
      ]
    },
    {
      title: "Pointage",
      content: [
        "Suivez les heures de travail de tous les membres de l'équipe."
      ],
      subsections: [
        {
          title: "Pour les Directeurs",
          content: [
            "• Surveillez la présence en temps réel des animateurs",
            "• Consultez les rapports détaillés",
            "• Gérez les pauses",
            "• Exportez les feuilles de temps"
          ]
        },
        {
          title: "Pour les Animateurs",
          content: [
            "• Pointez avec votre lien personnel",
            "• Enregistrez vos pauses",
            "• Consultez votre historique",
            "• Vérifiez vos récapitulatifs"
          ]
        }
      ]
    },
    {
      title: "Gestion du Budget",
      content: [
        "Système complet de suivi et de gestion du budget."
      ],
      subsections: [
        {
          title: "Configuration du Budget",
          content: [
            "1. Créez des catégories budgétaires",
            "2. Définissez les budgets annuels",
            "3. Choisissez entre année civile ou scolaire",
            "4. Suivez les dépenses et les revenus"
          ]
        }
      ]
    }
  ];

  const toggleSection = (title: string) => {
    setExpandedSections(prev => 
      prev.includes(title)
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  const filteredSections = helpSections.filter(section =>
    section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.content.some(c => c.toLowerCase().includes(searchTerm.toLowerCase())) ||
    section.subsections?.some(sub =>
      sub.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.content.some(c => c.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Book className="h-8 w-8 text-indigo-600 mr-3" />
          <h1 className="text-2xl font-semibold text-gray-900">Aide & Documentation</h1>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher dans l'aide..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-lg w-64 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Sujets</h2>
          <nav className="space-y-2">
            {helpSections.map((section) => (
              <a
                key={section.title}
                href={`#${section.title.toLowerCase().replace(/\s+/g, '-')}`}
                className="block px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md"
              >
                {section.title}
              </a>
            ))}
          </nav>
        </div>

        <div className="md:col-span-2 space-y-6">
          {filteredSections.map((section) => (
            <div
              key={section.title}
              id={section.title.toLowerCase().replace(/\s+/g, '-')}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100"
              >
                <h2 className="text-lg font-medium text-gray-900">{section.title}</h2>
                {expandedSections.includes(section.title) ? (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-500" />
                )}
              </button>

              {expandedSections.includes(section.title) && (
                <div className="p-6 space-y-4">
                  {section.content.map((paragraph, idx) => (
                    <p key={idx} className="text-gray-600">{paragraph}</p>
                  ))}

                  {section.subsections?.map((subsection) => (
                    <div key={subsection.title} className="mt-6">
                      <h3 className="text-md font-medium text-gray-900 mb-2">
                        {subsection.title}
                      </h3>
                      <div className="pl-4 space-y-2">
                        {subsection.content.map((item, idx) => (
                          <p key={idx} className="text-gray-600">{item}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}