# Changements apportés pour supporter les team_reviewers séparés

## Résumé
Ajout de la possibilité de spécifier les `team_reviewers` dans un tableau séparé des `reviewers` individuels dans la configuration.

## Modifications apportées

### 1. Interface Config (src/handler.ts)
- Ajout de la propriété `team_reviewers: string[]` à l'interface `Config`

### 2. Logique de sélection des reviewers (src/util.ts)
- Modification de la fonction `chooseReviewers()` pour traiter séparément :
  - `reviewers` : tableau des utilisateurs individuels (filtré pour exclure le créateur de la PR)
  - `team_reviewers` : tableau des équipes (utilisé tel quel)
- Le `numberOfReviewers` n'affecte que les reviewers individuels, pas les équipes

### 3. Documentation (README.md)
- Mise à jour de la section "Single Reviewers List" pour montrer l'utilisation de `team_reviewers`
- Suppression de l'ancienne section qui expliquait l'utilisation de la syntaxe `/team` dans `reviewers`
- Clarification que `numberOfReviewers` n'affecte que les reviewers individuels

### 4. Tests
- Ajout de tests pour vérifier le bon fonctionnement des `team_reviewers` séparés
- Mise à jour des tests existants pour utiliser la nouvelle structure
- Tests pour les cas de configurations vides ou manquantes

### 5. Exemple de configuration
- Création d'un fichier `auto_assign_example.yml` montrant la nouvelle syntaxe

## Usage

### Avant (ancienne méthode - toujours supportée pour les groupes)
```yaml
reviewers:
  - reviewer1
  - reviewer2
  - /team1
  - org/team2
```

### Maintenant (nouvelle méthode recommandée)
```yaml
reviewers:
  - reviewer1
  - reviewer2
  
team_reviewers:
  - team1
  - org/team2
```

## Avantages de cette approche
1. **Séparation claire** : Les utilisateurs et équipes sont clairement séparés
2. **Contrôle granulaire** : `numberOfReviewers` n'affecte que les utilisateurs individuels
3. **Facilité de configuration** : Plus facile de configurer et comprendre
4. **Compatibilité** : Les groupes continuent de fonctionner comme avant
5. **Pas de limite** : Toutes les équipes spécifiées sont ajoutées (pas de sélection aléatoire)

## Rétro-compatibilité
Cette modification est rétro-compatible. Si `team_reviewers` n'est pas spécifié, il sera traité comme un tableau vide et les équipes peuvent toujours être spécifiées dans `reviewers` via les groupes de review.
