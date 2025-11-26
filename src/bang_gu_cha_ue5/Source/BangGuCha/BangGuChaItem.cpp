#include "BangGuChaItem.h"
#include "BangGuChaGameModeBase.h"
#include "BangGuChaPawn.h"
#include "Components/SphereComponent.h"
#include "Components/StaticMeshComponent.h"

ABangGuChaItem::ABangGuChaItem() {
  PrimaryActorTick.bCanEverTick = true; // Maybe for rotation animation

  CollisionComp =
      CreateDefaultSubobject<USphereComponent>(TEXT("CollisionComp"));
  RootComponent = CollisionComp;
  CollisionComp->SetSphereRadius(30.f);
  CollisionComp->SetCollisionProfileName(TEXT("Trigger"));

  MeshComp = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("MeshComp"));
  MeshComp->SetupAttachment(RootComponent);
}

void ABangGuChaItem::BeginPlay() { Super::BeginPlay(); }

void ABangGuChaItem::NotifyActorBeginOverlap(AActor *OtherActor) {
  Super::NotifyActorBeginOverlap(OtherActor);

  if (Cast<ABangGuChaPawn>(OtherActor)) {
    if (ABangGuChaGameModeBase *GM =
            Cast<ABangGuChaGameModeBase>(GetWorld()->GetAuthGameMode())) {
      GM->OnFlagCollected();
    }
    Destroy();
  }
}
